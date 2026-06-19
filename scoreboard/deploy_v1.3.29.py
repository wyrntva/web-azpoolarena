#!/usr/bin/env python3
"""
Deploy v1.3.29 — Real-time scoreboard listing and control using MQTT over WebSockets

Files deployed:
  - app.py
  - core/live_score_service.py
  - core/mqtt_service.py
  - qml/Main.qml
  - qml/pages/MultiCardScorePage.qml
  - qml/pages/MultiQuickAddPage.qml
  - qml/pages/MultiScorePage.qml
  - requirements.txt
  - VERSION                      : 1.3.29

Usage: SB_PASS=admin python deploy_v1.3.29.py
"""

import os
import threading
import time
import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

IPS = [
    "192.168.1.165",
]
USERNAME = "azpoolarena"
PASSWORD = os.environ.get("SB_PASS", "")
REMOTE_APP_DIR = "/opt/azpool-scoreboard"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

FILES_TO_DEPLOY = {
    "app.py":                           "",
    "core/live_score_service.py":       "core",
    "core/mqtt_service.py":             "core",
    "qml/Main.qml":                     "qml",
    "qml/pages/MultiCardScorePage.qml": "qml/pages",
    "qml/pages/MultiQuickAddPage.qml":  "qml/pages",
    "qml/pages/MultiScorePage.qml":     "qml/pages",
    "requirements.txt":                 "",
}

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

        ssh.exec_command(
            "mkdir -p /tmp/sb_up/core /tmp/sb_up/qml/pages"
        )[1].channel.recv_exit_status()

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

        # Copy to destination using sudo and set correct owner
        for rel_path, dest_rel_dir in FILES_TO_DEPLOY.items():
            dest_path = f"{REMOTE_APP_DIR}/{rel_path}"
            
            # Copy file
            cmd = f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/{rel_path} {dest_path}"
            ssh.exec_command(cmd)[1].channel.recv_exit_status()
            
            # Set owner
            cmd_chown = f"echo '{PASSWORD}' | sudo -S chown azscoreboard:azscoreboard {dest_path}"
            ssh.exec_command(cmd_chown)[1].channel.recv_exit_status()

        # Copy VERSION file
        cmd_ver = f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/VERSION {REMOTE_APP_DIR}/VERSION"
        ssh.exec_command(cmd_ver)[1].channel.recv_exit_status()
        cmd_ver_chown = f"echo '{PASSWORD}' | sudo -S chown azscoreboard:azscoreboard {REMOTE_APP_DIR}/VERSION"
        ssh.exec_command(cmd_ver_chown)[1].channel.recv_exit_status()

        # Clean up tmp
        ssh.exec_command(f"echo '{PASSWORD}' | sudo -S rm -rf /tmp/sb_up")
        lines.append(f"+ Copied to {REMOTE_APP_DIR}")

        # Install dependencies in venv (especially paho-mqtt)
        pip_cmd = f"echo '{PASSWORD}' | sudo -S {REMOTE_APP_DIR}/venv/bin/pip install -r {REMOTE_APP_DIR}/requirements.txt"
        ssh.exec_command(pip_cmd)[1].channel.recv_exit_status()
        lines.append("+ Installed pip requirements")

        # Restart app
        _, out, _ = ssh.exec_command(
            f"echo '{PASSWORD}' | sudo -S pkill -f 'python.*app.py'; sleep 1; echo restarted"
        )
        out.read()
        lines.append("+ App restarted")

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
    version = file_contents.get("VERSION", "1.3.29")
    print("=" * 64)
    print(f"  AZ Scoreboard — Deploy v{version}")
    print("  Real-time scoreboard listing and control using MQTT over WebSockets")
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
