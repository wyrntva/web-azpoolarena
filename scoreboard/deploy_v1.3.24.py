#!/usr/bin/env python3
"""
Deploy v1.3.24 — Match start time persistence and join dialog fixes

Files deployed:
  - core/tournament_service.py: Save match start times to json
  - qml/components/TournamentJoinDialog.qml: Check-in updates
  - qml/pages/TournamentPage.qml: Use persistence for match timers
  - VERSION: 1.3.24

Usage: python deploy_v1.3.24.py
"""

import os
import threading
import time
import paramiko
import sys

# Ensure stdout handles UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

IPS = [
    "192.168.1.91",  "192.168.1.51",  "192.168.1.252", "192.168.1.12",
    "192.168.1.195", "192.168.1.165", "192.168.1.122", "192.168.1.133",
    "192.168.1.192", "192.168.1.73",  "192.168.1.233", "192.168.1.61",
]
USERNAME = "azpoolarena"
PASSWORD = "admin"
REMOTE_APP_DIR = "/opt/azpool-scoreboard"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

FILES_TO_DEPLOY = {
    "core": [
        "tournament_service.py",
    ],
    "qml/components": [
        "TournamentJoinDialog.qml",
    ],
    "qml/pages": [
        "TournamentPage.qml",
    ],
}

file_contents = {}
for subdir, files in FILES_TO_DEPLOY.items():
    for fname in files:
        local_path = os.path.join(SCRIPT_DIR, subdir.replace("/", os.sep), fname)
        if os.path.exists(local_path):
            with open(local_path, "r", encoding="utf-8") as fp:
                file_contents[f"{subdir}/{fname}"] = fp.read()
        else:
            print(f"[WARN] File not found: {local_path}")

version_path = os.path.join(SCRIPT_DIR, "VERSION")
if os.path.exists(version_path):
    with open(version_path, "r", encoding="utf-8") as f:
        file_contents["VERSION"] = f.read().strip()

results = {}
lock = threading.Lock()

def update_machine(ip):
    lines = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=USERNAME, password=PASSWORD, timeout=12)

        # Create temporary subdirs
        ssh.exec_command(
            "mkdir -p /tmp/sb_up/core /tmp/sb_up/qml/components /tmp/sb_up/qml/pages"
        )[1].channel.recv_exit_status()

        sftp = ssh.open_sftp()
        for rel_path, content in file_contents.items():
            remote_tmp = f"/tmp/sb_up/{rel_path}"
            remote_dir = os.path.dirname(remote_tmp)
            ssh.exec_command(f"mkdir -p {remote_dir}")[1].channel.recv_exit_status()
            with sftp.open(remote_tmp, "w") as f:
                f.write(content)
        sftp.close()
        lines.append(f"+ Uploaded {len(file_contents)} files")

        commands = [
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/core/* {REMOTE_APP_DIR}/core/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/components/* {REMOTE_APP_DIR}/qml/components/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/pages/* {REMOTE_APP_DIR}/qml/pages/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/VERSION {REMOTE_APP_DIR}/VERSION",
            f"echo '{PASSWORD}' | sudo -S rm -rf /tmp/sb_up",
        ]
        for cmd in commands:
            _, stdout, _ = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
        lines.append(f"+ Copied to {REMOTE_APP_DIR}")

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
    version = file_contents.get("VERSION", "1.3.24")
    print("=" * 64)
    print(f"  AZ Scoreboard - Deploy v{version}")
    print("  Match start time persistence & join dialog fixes")
    print(f"  Machines : {len(IPS)}")
    print(f"  Files    : {', '.join(file_contents.keys())}")
    print("=" * 64 + "\n")

    start = time.time()
    threads = [threading.Thread(target=update_machine, args=(ip,), daemon=True) for ip in IPS]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=45)

    elapsed = time.time() - start
    ok = fail = timeout = 0

    print("\n" + "=" * 64)
    print(f"RESULTS ({elapsed:.1f}s)")
    print("=" * 64)

    for ip in IPS:
        status, lines = results.get(ip, ("TIMEOUT", ["No response / SSH Timeout"]))
        icon = "[OK] " if status == "OK" else "[FAIL]"
        print(f"\n{icon}  {ip}")
        for line in lines:
            print(f"     {line}")
        if status == "OK":
            ok += 1
        elif status == "TIMEOUT":
            timeout += 1
        else:
            fail += 1

    print("\n" + "=" * 64)
    print(f"  Success : {ok}/{len(IPS)} machines")
    if fail:
        print(f"  Failed  : {fail}/{len(IPS)} machines")
    if timeout:
        print(f"  Timeout : {timeout}/{len(IPS)} machines")
    print("=" * 64 + "\n")

if __name__ == "__main__":
    main()
