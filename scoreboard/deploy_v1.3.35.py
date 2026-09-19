#!/usr/bin/env python3
"""
Deploy v1.3.35 — Fix decrementing score back down in event matches

Files deployed:
  - VERSION                         : 1.3.35
  - qml/pages/TournamentPage.qml    : Parse handicap starting score from handicap_desc instead of dynamic match score
  - all core, qml, assets, scripts

Targets: All 11 kiosk machines
Usage: python deploy_v1.3.35.py [IP1 IP2 ...]
"""

import os
import sys
import threading
import time
import tarfile
import io
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ──────── Target machines ────────
DEFAULT_IPS = [
    "192.168.1.91",
    "192.168.1.51",
    "192.168.1.252",
    "192.168.1.12",
    "192.168.1.195",
    "192.168.1.165",
    "192.168.1.122",
    "192.168.1.192",
    "192.168.1.73",
    "192.168.1.233",
    "192.168.1.61",
]

USERNAME = "azpoolarena"
PASSWORD = os.environ.get("SB_PASS", "admin")
REMOTE_APP_DIR = "/opt/azpool-scoreboard"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ──────── Build tar archive of the full app ────────
DEPLOY_DIRS = ["core", "qml", "assets", "scripts", "config"]
DEPLOY_FILES = ["app.py", "requirements.txt", "VERSION"]

EXCLUDE_EXACT_DIRS = {
    "__pycache__", "venv", "build", "packaging", ".git",
}
EXCLUDE_EXACT_FILES = {
    "dummy.txt", ".DS_Store", ".gitignore",
    "DEV_WINDOWS.md", "start_dev.bat", "run.ps1",
    "app_stdout.log", "app_stderr.log", "app.log",
    "run_check.log", "run_test.log",
}
EXCLUDE_EXTENSIONS = {".pyc", ".bak", ".log"}
EXCLUDE_PREFIXES = ["deploy_v", "deploy_scoreboards", "deploy_update", "debug", "test_vid"]


def should_exclude(name: str, is_dir: bool = False) -> bool:
    """Check if file/dir should be excluded from archive."""
    basename = os.path.basename(name)
    if is_dir:
        return basename in EXCLUDE_EXACT_DIRS
    if basename in EXCLUDE_EXACT_FILES:
        return True
    _, ext = os.path.splitext(basename)
    if ext in EXCLUDE_EXTENSIONS:
        return True
    for prefix in EXCLUDE_PREFIXES:
        if basename.startswith(prefix):
            return True
    return False


def build_tar_archive() -> bytes:
    """Build a tar.gz archive of the scoreboard app."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for fname in DEPLOY_FILES:
            fpath = os.path.join(SCRIPT_DIR, fname)
            if os.path.exists(fpath) and os.path.getsize(fpath) > 0:
                tar.add(fpath, arcname=fname)

        # Check kiosk-run.sh
        kiosk_path = os.path.join(SCRIPT_DIR, "kiosk-run.sh")
        if os.path.exists(kiosk_path) and os.path.getsize(kiosk_path) > 0:
            tar.add(kiosk_path, arcname="kiosk-run.sh")

        for dname in DEPLOY_DIRS:
            dpath = os.path.join(SCRIPT_DIR, dname)
            if os.path.isdir(dpath):
                for root, dirs, files in os.walk(dpath):
                    dirs[:] = [d for d in dirs if not should_exclude(d, is_dir=True)]
                    for f in files:
                        if should_exclude(f):
                            continue
                        full = os.path.join(root, f)
                        arcname = os.path.relpath(full, SCRIPT_DIR)
                        tar.add(full, arcname=arcname)

    return buf.getvalue()


results: dict = {}
lock = threading.Lock()


def update_machine(ip: str, archive_data: bytes):
    lines = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=USERNAME, password=PASSWORD, timeout=15)

        # Upload archive
        sftp = ssh.open_sftp()
        with sftp.open("/tmp/sb_deploy.tar.gz", "wb") as f:
            f.write(archive_data)
        sftp.close()
        lines.append(f"+ Uploaded archive ({len(archive_data)//1024}KB)")

        # Extract to temp dir
        cmd = f"echo '{PASSWORD}' | sudo -S bash -c 'rm -rf /tmp/sb_deploy_dir && mkdir -p /tmp/sb_deploy_dir && tar xzf /tmp/sb_deploy.tar.gz -C /tmp/sb_deploy_dir'"
        _, out, err = ssh.exec_command(cmd)
        out.channel.recv_exit_status()
        lines.append("+ Extracted archive")

        # Backup current VERSION
        _, out, _ = ssh.exec_command(f"cat {REMOTE_APP_DIR}/VERSION 2>/dev/null || echo 'unknown'")
        old_ver = out.read().decode().strip()
        lines.append(f"+ Previous version: {old_ver}")

        # Copy files to destination
        cmd_cp = f"echo '{PASSWORD}' | sudo -S bash -c 'cp -rf /tmp/sb_deploy_dir/* {REMOTE_APP_DIR}/'"
        _, out, err = ssh.exec_command(cmd_cp)
        exit_code = out.channel.recv_exit_status()
        if exit_code != 0:
            lines.append(f"- WARN: cp returned code {exit_code}")
        lines.append(f"+ Copied to {REMOTE_APP_DIR}")

        # Fix CRLF line endings, permissions, ownership and .env
        cmd_perms = (
            f"echo '{PASSWORD}' | sudo -S bash -c '"
            f"if [ ! -f {REMOTE_APP_DIR}/.env ]; then "
            f"echo \"POOLARENA_API_BASE_URL=https://cms.poolarena.vn\" > {REMOTE_APP_DIR}/.env; fi && "
            f"find {REMOTE_APP_DIR} -name \"*.sh\" -exec sed -i \"s/\\r$//\" {{}} + && "
            f"find {REMOTE_APP_DIR} -name \"*.py\" -exec sed -i \"s/\\r$//\" {{}} + && "
            f"chmod +x {REMOTE_APP_DIR}/kiosk-run.sh 2>/dev/null || true && "
            f"chmod +x {REMOTE_APP_DIR}/scripts/*.sh 2>/dev/null || true && "
            f"chmod -R 755 {REMOTE_APP_DIR}/scripts 2>/dev/null || true && "
            f"chown -R azscoreboard:azscoreboard {REMOTE_APP_DIR}/'"
        )
        _, out, _ = ssh.exec_command(cmd_perms)
        out.channel.recv_exit_status()
        lines.append("+ Fixed CRLF line endings, permissions, ownership and .env")

        # Clean up
        ssh.exec_command(f"echo '{PASSWORD}' | sudo -S rm -rf /tmp/sb_deploy.tar.gz /tmp/sb_deploy_dir")

        # Restart app
        _, out, _ = ssh.exec_command(
            f"echo '{PASSWORD}' | sudo -S pkill -f 'python.*app.py'; sleep 3; echo restarted"
        )
        out.read()
        lines.append("+ App process restarted via pkill")

        # Wait a bit for kiosk loop to restart app
        time.sleep(2)

        # Verify version
        _, out, _ = ssh.exec_command(f"cat {REMOTE_APP_DIR}/VERSION 2>/dev/null || echo 'unknown'")
        ver = out.read().decode().strip()
        lines.append(f"+ Deployed Version: {ver}")

        # Verify running PID
        _, out, _ = ssh.exec_command("pgrep -f 'python.*app.py' || echo 'restarting...'")
        pid = out.read().decode().strip()
        lines.append(f"+ Running PID: {pid}")

        ssh.close()
        with lock:
            results[ip] = ("OK", lines)

    except Exception as e:
        with lock:
            results[ip] = ("FAIL", [str(e)])


def main():
    ips = sys.argv[1:] if len(sys.argv) > 1 else DEFAULT_IPS

    print("=" * 64)
    print(f"  AZ Scoreboard — Deploy v1.3.35")
    print(f"  Fix score decrement in event matches")
    print(f"  Targets  : {len(ips)} machines ({', '.join(ips)})")
    print("=" * 64 + "\n")

    print(">>> Building deployment archive...")
    archive_data = build_tar_archive()
    print(f"    Archive size: {len(archive_data)//1024}KB\n")

    start = time.time()
    threads = [
        threading.Thread(target=update_machine, args=(ip, archive_data), daemon=True)
        for ip in ips
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=75)

    elapsed = time.time() - start
    print("\n" + "=" * 64)
    print(f"RESULTS ({elapsed:.1f}s)")
    print("=" * 64)

    ok = fail = 0
    for ip in ips:
        status, lines = results.get(ip, ("TIMEOUT", ["No response / SSH Timeout"]))
        icon = "[OK]  " if status == "OK" else "[FAIL]"
        print(f"\n{icon}  {ip}")
        for line in lines:
            print(f"       {line}")
        if status == "OK":
            ok += 1
        else:
            fail += 1

    print("\n" + "=" * 64)
    print(f"  Success : {ok}/{len(ips)}")
    if fail:
        print(f"  Failed  : {fail}/{len(ips)}")
    print("=" * 64 + "\n")

    if fail > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
