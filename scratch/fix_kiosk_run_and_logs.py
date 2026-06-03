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
    
    # 2. Kill all orphaned processes
    run_cmd("pkill -9 -f 'main.py'", run_sudo=True)
    run_cmd("pkill -9 -f 'kiosk-run.sh'", run_sudo=True)
    
    # 3. Rewrite /opt/azpool-imagedisplay/kiosk-run.sh to write to app.log locally
    new_kiosk_run = """#!/bin/bash

# Thiết lập DISPLAY và XAUTHORITY nếu chưa có
export DISPLAY=:0
export XAUTHORITY=/run/user/1000/gdm/Xauthority

# Cho phép kết nối tới X server
xhost +SI:localuser:poolarena 2>/dev/null
xhost + 2>/dev/null

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
    
    # 4. Start the service
    run_cmd("systemctl start azpool-imagedisplay.service", run_sudo=True)
    
    # 5. Wait 6 seconds
    print("Waiting 6 seconds...")
    time.sleep(6)
    
    # 6. Check logs from the new app.log file!
    run_cmd("tail -n 50 /opt/azpool-imagedisplay/app.log")
    
    # 7. Check running processes
    run_cmd("ps aux | grep -E 'python.*main.py|image-display'")

    ssh.close()

if __name__ == "__main__":
    main()
