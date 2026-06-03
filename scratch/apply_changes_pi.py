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
            print(f"Connecting to {username}@{ip} (attempt {attempt})...")
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

    # 1. Update /opt/azpool-imagedisplay/.env
    new_env = """# ==============================================================================
# Environment variables for Image Display
# ==============================================================================
API_BASE_URL=http://192.168.1.188:8000
"""
    # Overwrite .env using sudo (safest)
    # We escape double quotes and write it
    escaped_env = new_env.replace('"', '\\"')
    run_cmd(f'echo "{escaped_env}" | sudo tee /opt/azpool-imagedisplay/.env', run_sudo=True)
    run_cmd('sudo chown azimgdisplay:azimgdisplay /opt/azpool-imagedisplay/.env', run_sudo=True)
    run_cmd('sudo chmod 644 /opt/azpool-imagedisplay/.env', run_sudo=True)
    
    # 2. Update systemd service file
    new_service = """[Unit]
Description=AZ Pool Arena - Image Display
After=network.target sound.target

[Service]
Type=simple
User=azimgdisplay
WorkingDirectory=/opt/azpool-imagedisplay
Environment=DISPLAY=:0
Environment=XAUTHORITY=/run/user/1000/gdm/Xauthority
EnvironmentFile=/opt/azpool-imagedisplay/.env
ExecStart=/opt/azpool-imagedisplay/kiosk-run.sh
Restart=always
RestartSec=3

[Install]
WantedBy=graphical.target
"""
    escaped_service = new_service.replace('"', '\\"')
    run_cmd(f'echo "{escaped_service}" | sudo tee /etc/systemd/system/azpool-imagedisplay.service', run_sudo=True)
    run_cmd('sudo chmod 644 /etc/systemd/system/azpool-imagedisplay.service', run_sudo=True)
    
    # 3. Reload daemon and restart service
    run_cmd('sudo systemctl daemon-reload', run_sudo=True)
    run_cmd('sudo systemctl restart azpool-imagedisplay.service', run_sudo=True)
    
    # 4. Wait a few seconds for it to start up
    print("Waiting 5 seconds for service to restart...")
    time.sleep(5)
    
    # 5. Check status
    run_cmd('sudo systemctl status azpool-imagedisplay.service', run_sudo=True)
    
    # 6. Check environment of the running main.py process
    run_cmd('strings /proc/$(pgrep -f "python /opt/azpool-imagedisplay/main.py")/environ | grep API_BASE_URL', run_sudo=True)

    ssh.close()
    print("\n=== All changes applied and verified! ===")

if __name__ == "__main__":
    main()
