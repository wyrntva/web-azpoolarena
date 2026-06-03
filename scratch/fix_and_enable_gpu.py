import paramiko
import time
import sys

def main():
    ip = "192.168.1.84"
    username = "poolarena"
    password = "admin"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    connected = False
    for attempt in range(1, 6):
        try:
            ssh.connect(ip, username=username, password=password, timeout=10)
            connected = True
            break
        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")
            time.sleep(3)
            
    if not connected:
        print("Could not connect to Pi.")
        sys.exit(1)
        
    def run_cmd(cmd, run_sudo=False):
        if run_sudo:
            cmd = f"echo '{password}' | sudo -S {cmd}"
        print(f"\n--- Running: {cmd} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        code = stdout.channel.recv_exit_status()
        print(f"Exit code: {code}")
        if out:
            print("STDOUT:")
            print(out.strip())
        if err:
            print("STDERR:")
            print(err.strip())
        return code, out, err

    # 1. Stop the service first
    run_cmd("systemctl stop azpool-imagedisplay.service", run_sudo=True)
    
    # 2. Find the active Xorg auth file
    _, out, _ = run_cmd("ps aux | grep Xorg | grep -v grep")
    import re
    match = re.search(r'-auth\s+([^\s]+)', out)
    if not match:
        print("Could not find Xorg auth file.")
        ssh.close()
        sys.exit(1)
        
    auth_file = match.group(1)
    print(f"Found active Xorg auth file: {auth_file}")
    
    # 3. Disable X server access control using the found auth file
    run_cmd(f"DISPLAY=:0 XAUTHORITY={auth_file} xhost +", run_sudo=True)
    
    # 4. Overwrite systemd service to run as poolarena (UID 1000)
    # We remove QSG_INFO=1 for production to keep logs clean
    new_service = """[Unit]
Description=AZ Pool Arena - Image Display
After=network.target sound.target

[Service]
Type=simple
User=poolarena
WorkingDirectory=/opt/azpool-imagedisplay
Environment=DISPLAY=:0
Environment=QSG_INFO=1
EnvironmentFile=/opt/azpool-imagedisplay/.env
ExecStart=/opt/azpool-imagedisplay/kiosk-run.sh
Restart=always
RestartSec=3

[Install]
WantedBy=graphical.target
"""
    escaped_service = new_service.replace('"', '\\"')
    run_cmd(f'echo "{escaped_service}" | sudo tee /etc/systemd/system/azpool-imagedisplay.service', run_sudo=True)
    run_cmd("sudo chmod 644 /etc/systemd/system/azpool-imagedisplay.service", run_sudo=True)
    
    # 5. Overwrite kiosk-run.sh to be clean and write logs locally
    # We also include a call to dynamically run xhost + on startup if needed
    new_kiosk_run = f"""#!/bin/bash

# Thiết lập DISPLAY
export DISPLAY=:0

# Tự động tìm XAUTHORITY từ process Xorg đang chạy để tự động cấp quyền
DETECTED_AUTH=$(ps aux | grep Xorg | grep -v grep | grep -o '\\-auth [^ ]*' | awk '{{print $2}}' | head -n 1)
if [ -n "$DETECTED_AUTH" ]; then
    echo "Dynamic Xauthority detected: $DETECTED_AUTH"
    # Cấp quyền cho local connections
    echo '{password}' | sudo -S DISPLAY=:0 XAUTHORITY="$DETECTED_AUTH" xhost + 2>/dev/null
fi

cd /opt/azpool-imagedisplay

# Loop vĩnh viễn để tự động restart nếu app crash
while true; do
    echo "Starting AZ Pool Arena - Image Display..."
    
    # Kích hoạt venv và chạy ứng dụng
    source venv/bin/activate
    
    # Chạy với chế độ log ra file để dễ debug
    python main.py >> app.log 2>&1
    
    echo "App exited. Restarting in 5 seconds..."
    sleep 5
done
"""
    escaped_kiosk = new_kiosk_run.replace('"', '\\"')
    run_cmd(f'echo "{escaped_kiosk}" | sudo tee /opt/azpool-imagedisplay/kiosk-run.sh', run_sudo=True)
    run_cmd("chmod +x /opt/azpool-imagedisplay/kiosk-run.sh", run_sudo=True)
    run_cmd("chown poolarena:poolarena /opt/azpool-imagedisplay/kiosk-run.sh", run_sudo=True)

    # 6. Kill all orphaned processes
    run_cmd("pkill -9 -f 'main.py'", run_sudo=True)
    run_cmd("pkill -9 -f 'kiosk-run.sh'", run_sudo=True)
    
    # 7. Reload and start service
    run_cmd("systemctl daemon-reload", run_sudo=True)
    run_cmd("systemctl start azpool-imagedisplay.service", run_sudo=True)
    
    # 8. Wait 7 seconds
    print("Waiting 7 seconds...")
    time.sleep(7)
    
    # 9. Print logs from app.log to verify GPU acceleration (Device: V3D 7.1)
    run_cmd("tail -n 50 /opt/azpool-imagedisplay/app.log")
    
    # 10. Check CPU usage of the process
    run_cmd("ps aux | grep -E 'python.*main.py|image-display'")

    ssh.close()

if __name__ == "__main__":
    main()
