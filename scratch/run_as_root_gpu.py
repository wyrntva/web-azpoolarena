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

    # 1. Stop the service
    run_cmd("systemctl stop azpool-imagedisplay.service", run_sudo=True)
    
    # 2. Kill all existing instances
    run_cmd("pkill -9 -f 'main.py'", run_sudo=True)
    run_cmd("pkill -9 -f 'kiosk-run.sh'", run_sudo=True)
    
    # 3. SFTP Upload the clean kiosk-run.sh to /tmp/kiosk-run.sh
    kiosk_content = """#!/bin/bash

# Thiết lập DISPLAY
export DISPLAY=:0

# Tự động tìm XAUTHORITY từ process Xorg đang chạy
DETECTED_AUTH=$(ps aux | grep Xorg | grep -v grep | grep -o '\\-auth [^ ]*' | awk '{print $2}' | head -n 1)
if [ -n "$DETECTED_AUTH" ]; then
    export XAUTHORITY="$DETECTED_AUTH"
    echo "Using Xauthority: $XAUTHORITY"
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
    sftp = ssh.open_sftp()
    with sftp.open("/tmp/kiosk-run.sh", "w") as f:
        f.write(kiosk_content)
    sftp.close()
    
    # Copy from /tmp to /opt/azpool-imagedisplay/
    run_cmd("cp /tmp/kiosk-run.sh /opt/azpool-imagedisplay/kiosk-run.sh", run_sudo=True)
    run_cmd("chmod +x /opt/azpool-imagedisplay/kiosk-run.sh", run_sudo=True)
    run_cmd("chown root:root /opt/azpool-imagedisplay/kiosk-run.sh", run_sudo=True)
    run_cmd("rm -f /tmp/kiosk-run.sh")
    
    # 4. Overwrite systemd service to run as User=root
    new_service = """[Unit]
Description=AZ Pool Arena - Image Display
After=network.target sound.target

[Service]
Type=simple
User=root
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
    # Write to /tmp first
    sftp = ssh.open_sftp()
    with sftp.open("/tmp/azpool-imagedisplay.service", "w") as f:
        f.write(new_service)
    sftp.close()
    
    # Copy to systemd
    run_cmd("cp /tmp/azpool-imagedisplay.service /etc/systemd/system/azpool-imagedisplay.service", run_sudo=True)
    run_cmd("chmod 644 /etc/systemd/system/azpool-imagedisplay.service", run_sudo=True)
    run_cmd("rm -f /tmp/azpool-imagedisplay.service")
    
    # 5. Reset app.log to start fresh
    run_cmd("rm -f /opt/azpool-imagedisplay/app.log", run_sudo=True)
    
    # 6. Reload and start
    run_cmd("systemctl daemon-reload", run_sudo=True)
    run_cmd("systemctl start azpool-imagedisplay.service", run_sudo=True)
    
    # 7. Wait 8 seconds
    print("Waiting 8 seconds...")
    time.sleep(8)
    
    # 8. Print logs
    run_cmd("cat /opt/azpool-imagedisplay/app.log", run_sudo=True)
    
    # 9. Check status and processes
    run_cmd("systemctl status azpool-imagedisplay.service")
    run_cmd("ps aux | grep -E 'python.*main.py|image-display'")

    ssh.close()

if __name__ == "__main__":
    main()
