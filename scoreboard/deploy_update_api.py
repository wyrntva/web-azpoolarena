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
# API Base URL - production backend server
POOLARENA_API_BASE_URL=https://cms.poolarena.vn
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

results = {}
lock = threading.Lock()


def update_machine(ip):
    lines = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=USERNAME, password=PASSWORD, timeout=15)
        sftp = ssh.open_sftp()

        # 1. Cập nhật .env
        env_remote = f"{REMOTE_APP_DIR}/.env"
        with sftp.open(env_remote, "w") as f:
            f.write(NEW_ENV)
        lines.append("✓ .env → https://cms.poolarena.vn")

        # 2. Copy các file core mới nhất
        for fname, content in core_contents.items():
            remote_path = f"{REMOTE_APP_DIR}/core/{fname}"
            with sftp.open(remote_path, "w") as f:
                f.write(content)
            lines.append(f"✓ core/{fname}")

        sftp.close()

        # 3. Xóa __pycache__ (buộc Python reload)
        ssh.exec_command(f"rm -rf {REMOTE_APP_DIR}/core/__pycache__")
        lines.append("✓ __pycache__ cleared")

        # 4. Restart app — kiosk-run.sh tự khởi động lại sau pkill
        _, out, _ = ssh.exec_command("pkill -f 'python app.py'; sleep 1; echo restarted")
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
    print(f"  New URL  : https://cms.poolarena.vn")
    print(f"  Core files: {len(core_contents)} files")
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
