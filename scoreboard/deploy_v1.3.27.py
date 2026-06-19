#!/usr/bin/env python3
"""
Deploy v1.3.27 — Live score sync: gửi tỉ số ScorePage / MultiScorePage về backend

Files deployed:
  - core/live_score_service.py  : Service mới — gửi điểm về /api/tournaments/device/live-score
  - app.py                      : Đăng ký LiveScoreService vào QML context
  - qml/pages/ScorePage.qml     : syncScoreToBackend() + Connections Controller
  - qml/pages/MultiScorePage.qml: syncScoreToBackend() gọi khi điểm thay đổi
  - VERSION                     : 1.3.27

Usage: python deploy_v1.3.27.py
"""

import os
import threading
import time
import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

IPS = [
    "192.168.1.12",
]
USERNAME = "azpoolarena"
PASSWORD = os.environ.get("SB_PASS", "")
REMOTE_APP_DIR = "/opt/azpool-scoreboard"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Map: relative_path_in_repo -> remote_subdir (dưới REMOTE_APP_DIR)
FILES_TO_DEPLOY = {
    "core/live_score_service.py": "core",
    "app.py":                     "",
    "qml/pages/ScorePage.qml":    "qml/pages",
    "qml/pages/MultiScorePage.qml":"qml/pages",
}

# Load file contents from local
file_contents: dict[str, str] = {}
for rel_path in FILES_TO_DEPLOY:
    local_path = os.path.join(SCRIPT_DIR, rel_path.replace("/", os.sep))
    if os.path.exists(local_path):
        with open(local_path, "r", encoding="utf-8") as fp:
            file_contents[rel_path] = fp.read()
    else:
        print(f"[WARN] File not found: {local_path}")

version_path = os.path.join(SCRIPT_DIR, "VERSION")
if os.path.exists(version_path):
    with open(version_path, "r", encoding="utf-8") as f:
        file_contents["VERSION"] = f.read().strip()

results: dict = {}
lock = threading.Lock()


def update_machine(ip: str):
    lines = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=USERNAME, password=PASSWORD, timeout=15)

        # Tạo thư mục tạm
        ssh.exec_command(
            "mkdir -p /tmp/sb_up/core /tmp/sb_up/qml/pages"
        )[1].channel.recv_exit_status()

        # Upload qua SFTP
        sftp = ssh.open_sftp()
        for rel_path, content in file_contents.items():
            if rel_path == "VERSION":
                remote_tmp = "/tmp/sb_up/VERSION"
            else:
                remote_tmp = f"/tmp/sb_up/{rel_path}"
                remote_dir = os.path.dirname(remote_tmp)
                ssh.exec_command(f"mkdir -p {remote_dir}")[1].channel.recv_exit_status()
            with sftp.open(remote_tmp, "w") as f:
                f.write(content)
        sftp.close()
        lines.append(f"+ Uploaded {len(file_contents)} files")

        # Copy vào app dir
        commands = [
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/core/live_score_service.py {REMOTE_APP_DIR}/core/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/app.py {REMOTE_APP_DIR}/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/pages/ScorePage.qml {REMOTE_APP_DIR}/qml/pages/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/pages/MultiScorePage.qml {REMOTE_APP_DIR}/qml/pages/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/VERSION {REMOTE_APP_DIR}/VERSION",
            f"echo '{PASSWORD}' | sudo -S rm -rf /tmp/sb_up",
        ]
        for cmd in commands:
            _, stdout, _ = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
        lines.append(f"+ Copied to {REMOTE_APP_DIR}")

        # Restart app
        _, out, _ = ssh.exec_command(
            f"echo '{PASSWORD}' | sudo -S pkill -f 'python.*app.py'; sleep 1; echo restarted"
        )
        out.read()
        lines.append("+ App restarted")

        # Verify version
        _, out, _ = ssh.exec_command(f"cat {REMOTE_APP_DIR}/VERSION 2>/dev/null || echo 'unknown'")
        ver = out.read().decode().strip()
        lines.append(f"+ Version: {ver}")

        ssh.close()
        with lock:
            results[ip] = ("OK", lines)

    except Exception as e:
        with lock:
            results[ip] = ("FAIL", [str(e)])


def main():
    if not PASSWORD:
        print("[ERROR] PASSWORD is empty.")
        sys.exit(1)

    version = file_contents.get("VERSION", "1.3.27")
    print("=" * 64)
    print(f"  AZ Scoreboard — Deploy v{version}")
    print("  Live score sync: ScorePage + MultiScorePage → backend")
    print(f"  Target   : {IPS[0]}")
    print(f"  Files    : {len(file_contents)} files")
    print("=" * 64 + "\n")

    for rel in file_contents:
        print(f"  • {rel}")
    print()

    start = time.time()
    threads = [threading.Thread(target=update_machine, args=(ip,), daemon=True) for ip in IPS]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=45)

    elapsed = time.time() - start
    print("\n" + "=" * 64)
    print(f"RESULTS ({elapsed:.1f}s)")
    print("=" * 64)

    ok = fail = 0
    for ip in IPS:
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
    print(f"  Success : {ok}/{len(IPS)}")
    if fail:
        print(f"  Failed  : {fail}/{len(IPS)}")
    print("=" * 64 + "\n")


if __name__ == "__main__":
    main()
