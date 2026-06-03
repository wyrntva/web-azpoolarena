#!/usr/bin/env python3
"""
Deploy API URL update tới tất cả máy kiosk scoreboard.

Thay đổi:
  - .env: POOLARENA_API_BASE_URL → https://cms.poolarena.vn
  - core/device_activation_service.py: sửa fallback mặc định
  - core/rankings_service.py: cập nhật comment

Chạy: python3 deploy_update_api.py
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

NEW_ENV = """# Scoreboard Environment Configuration
# API Base URL - development backend server
POOLARENA_API_BASE_URL=http://192.168.1.188:8000
"""

# Đọc file core mới nhất từ repo local
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CORE_DIR = os.path.join(SCRIPT_DIR, "core")
CORE_FILES = [
    "device_activation_service.py",
    "rankings_service.py",
    "tournament_service.py",
    "orders_service.py",
    "banner_service.py",
    "rankings_service.py",
    "image_cache_service.py",
    "controller.py",
    "device_settings.py",
]

core_contents = {}
for f in CORE_FILES:
    path = os.path.join(CORE_DIR, f)
    if os.path.exists(path):
        with open(path, "r") as fp:
            core_contents[f] = fp.read()
    else:
        print(f"[WARN] Local file not found: {path}")

# Đọc các file QML mới nhất từ repo local
QML_DIR = os.path.join(SCRIPT_DIR, "qml")
QML_FILES = [
    "components/TournamentJoinDialog.qml",
    "pages/TournamentPage.qml",
]

qml_contents = {}
for f in QML_FILES:
    path = os.path.join(QML_DIR, f)
    if os.path.exists(path):
        with open(path, "r") as fp:
            qml_contents[f] = fp.read()
    else:
        print(f"[WARN] Local file not found: {path}")

results = {}
lock = threading.Lock()


def update_machine(ip):
    lines = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=USERNAME, password=PASSWORD, timeout=15)

        # 1. Tạo thư mục tạm trên remote
        _, stdout, stderr = ssh.exec_command("mkdir -p /tmp/sb_up/core /tmp/sb_up/qml/components /tmp/sb_up/qml/pages")
        stdout.channel.recv_exit_status()

        sftp = ssh.open_sftp()

        # Upload .env
        with sftp.open("/tmp/sb_up/.env", "w") as f:
            f.write(NEW_ENV)
        lines.append("✓ .env uploaded to temp")

        # Upload core files
        for fname, content in core_contents.items():
            with sftp.open(f"/tmp/sb_up/core/{fname}", "w") as f:
                f.write(content)
        lines.append(f"✓ core files uploaded to temp")

        # Upload QML files
        for fname, content in qml_contents.items():
            with sftp.open(f"/tmp/sb_up/qml/{fname}", "w") as f:
                f.write(content)
        lines.append(f"✓ QML files uploaded to temp")

        sftp.close()

        # 2. Sao chép vào /opt/azpool-scoreboard bằng sudo
        commands = [
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/.env {REMOTE_APP_DIR}/.env",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/core/* {REMOTE_APP_DIR}/core/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/components/* {REMOTE_APP_DIR}/qml/components/",
            f"echo '{PASSWORD}' | sudo -S cp /tmp/sb_up/qml/pages/* {REMOTE_APP_DIR}/qml/pages/",
            f"echo '{PASSWORD}' | sudo -S rm -rf {REMOTE_APP_DIR}/core/__pycache__",
            f"echo '{PASSWORD}' | sudo -S rm -rf /tmp/sb_up",
        ]

        for cmd in commands:
            _, stdout, stderr = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()

        lines.append("✓ Copied to /opt/azpool-scoreboard via sudo")
        lines.append("✓ __pycache__ cleared")

        # 3. Restart app
        _, out, _ = ssh.exec_command(f"echo '{PASSWORD}' | sudo -S pkill -f 'python app.py'; sleep 1; echo restarted")
        out.read()
        lines.append("✓ App restarted")

        ssh.close()
        with lock:
            results[ip] = ("OK", lines)

    except Exception as e:
        with lock:
            results[ip] = ("FAIL", [str(e)])


def main():
    print(f"{'='*62}")
    print(f"  AZ Scoreboard — Deploy API URL Update")
    print(f"  Machines : {len(IPS)}")
    print(f"  New URL  : http://192.168.1.188:8000")
    print(f"  Core/QML files: {len(core_contents) + len(qml_contents)} files")
    print(f"{'='*62}\n")

    start = time.time()
    threads = [threading.Thread(target=update_machine, args=(ip,), daemon=True) for ip in IPS]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)

    elapsed = time.time() - start
    ok, fail = 0, 0

    print(f"\n{'='*62}")
    print(f"KẾT QUẢ ({elapsed:.1f}s)")
    print(f"{'='*62}")

    for ip in IPS:
        status, lines = results.get(ip, ("TIMEOUT", ["No response"]))
        icon = "✅" if status == "OK" else "❌"
        print(f"\n{icon}  {ip}")
        for line in lines:
            print(f"     {line}")
        if status == "OK":
            ok += 1
        else:
            fail += 1

    print(f"\n{'='*62}")
    print(f"  Thành công : {ok}/{len(IPS)} máy")
    if fail:
        print(f"  Thất bại   : {fail}/{len(IPS)} máy")
    print(f"{'='*62}\n")


if __name__ == "__main__":
    main()
