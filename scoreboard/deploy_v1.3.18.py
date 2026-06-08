#!/usr/bin/env python3
"""
Deploy v1.3.18 — Bugfix: countdownTimer trong TournamentJoinDialog reset điểm sau khi đóng

Root cause:
  countdownTimer trong TournamentJoinDialog chạy mỗi giây và gọi checkLatePenalties().
  checkLatePenalties() so sánh Controller.leftScore với expectedP1Score (= leftMinScore).
  Sau khi cả hai xác nhận và dialog đóng, timer KHÔNG dừng → tiếp tục chạy ngầm.
  Mỗi khi user bấm tăng điểm (VD: 0 → 1), trong vòng 1 giây checkLatePenalties() thấy
  1 !== 0 (leftMinScore) → reset score về 0 và gửi 0 lên server → bảng nhảy về 0.

Các thay đổi:
  - qml/components/TournamentJoinDialog.qml:
      + checkLatePenalties(): return sớm khi cả hai đã confirmed (guard chính)
      + checkBoth(): gọi countdownTimer.stop() trước khi autoCloseTimer chạy
  - qml/pages/TournamentPage.qml:
      + playersChanged: chỉ trigger khi CẢ HAI ID cũ VÀ mới đều > 0 và khác nhau
        (tránh false positive khi server trả player1_id: null)
  - VERSION: 1.3.17 → 1.3.18

Chạy: python3 deploy_v1.3.18.py
"""

import os
import threading
import time
import paramiko

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
            print(f"[WARN] File không tìm thấy: {local_path}")

version_path = os.path.join(SCRIPT_DIR, "VERSION")
if os.path.exists(version_path):
    with open(version_path, "r") as f:
        file_contents["VERSION"] = f.read().strip()

results = {}
lock = threading.Lock()


def update_machine(ip):
    lines = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=USERNAME, password=PASSWORD, timeout=15)

        ssh.exec_command(
            "mkdir -p /tmp/sb_up/qml/components /tmp/sb_up/qml/pages"
        )[1].channel.recv_exit_status()

        sftp = ssh.open_sftp()
        for rel_path, content in file_contents.items():
            remote_tmp = f"/tmp/sb_up/{rel_path}" if rel_path != "VERSION" else "/tmp/sb_up/VERSION"
            remote_dir = os.path.dirname(remote_tmp)
            ssh.exec_command(f"mkdir -p {remote_dir}")[1].channel.recv_exit_status()
            with sftp.open(remote_tmp, "w") as f:
                f.write(content)
        sftp.close()
        lines.append(f"✓ Uploaded {len(file_contents)} files")

        commands = [
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/components/* {REMOTE_APP_DIR}/qml/components/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/pages/* {REMOTE_APP_DIR}/qml/pages/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/VERSION {REMOTE_APP_DIR}/VERSION",
            f"echo '{PASSWORD}' | sudo -S rm -rf /tmp/sb_up",
        ]
        for cmd in commands:
            _, stdout, _ = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
        lines.append(f"✓ Copied to {REMOTE_APP_DIR}")

        _, out, _ = ssh.exec_command(
            f"echo '{PASSWORD}' | sudo -S pkill -f 'python.*app.py'; sleep 1; echo restarted"
        )
        out.read()
        lines.append("✓ App restarted")

        _, out, _ = ssh.exec_command(f"cat {REMOTE_APP_DIR}/VERSION 2>/dev/null || echo 'unknown'")
        ver = out.read().decode().strip()
        lines.append(f"✓ Version: {ver}")

        ssh.close()
        with lock:
            results[ip] = ("OK", lines)

    except Exception as e:
        with lock:
            results[ip] = ("FAIL", [str(e)])


def main():
    version = file_contents.get("VERSION", "1.3.18")
    print(f"{'='*64}")
    print(f"  AZ Scoreboard — Deploy v{version}")
    print(f"  Fix: countdownTimer reset điểm sau khi join dialog đóng")
    print(f"  Machines : {len(IPS)}")
    print(f"  Files    : {', '.join(file_contents.keys())}")
    print(f"{'='*64}\n")

    start = time.time()
    threads = [threading.Thread(target=update_machine, args=(ip,), daemon=True) for ip in IPS]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=60)

    elapsed = time.time() - start
    ok = fail = timeout = 0

    print(f"\n{'='*64}")
    print(f"KẾT QUẢ ({elapsed:.1f}s)")
    print(f"{'='*64}")

    for ip in IPS:
        status, lines = results.get(ip, ("TIMEOUT", ["Không có phản hồi"]))
        icon = "✅" if status == "OK" else "❌"
        print(f"\n{icon}  {ip}")
        for line in lines:
            print(f"     {line}")
        if status == "OK":
            ok += 1
        elif status == "TIMEOUT":
            timeout += 1
        else:
            fail += 1

    print(f"\n{'='*64}")
    print(f"  Thành công : {ok}/{len(IPS)} máy")
    if fail:
        print(f"  Thất bại   : {fail}/{len(IPS)} máy")
    if timeout:
        print(f"  Timeout    : {timeout}/{len(IPS)} máy")
    print(f"{'='*64}\n")


if __name__ == "__main__":
    main()
