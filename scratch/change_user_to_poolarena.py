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
    
    # 2. Change ownership of /opt/azpool-imagedisplay to poolarena
    run_cmd("chown -R poolarena:poolarena /opt/azpool-imagedisplay", run_sudo=True)
    
    # 3. Modify systemd service to run as poolarena (User=poolarena) with QSG_INFO=1
    new_service = """[Unit]
Description=AZ Pool Arena - Image Display
After=network.target sound.target

[Service]
Type=simple
User=poolarena
WorkingDirectory=/opt/azpool-imagedisplay
Environment=DISPLAY=:0
Environment=QSG_INFO=1
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
    run_cmd("sudo chmod 644 /etc/systemd/system/azpool-imagedisplay.service", run_sudo=True)
    
    # 4. Reload and restart service
    run_cmd("systemctl daemon-reload", run_sudo=True)
    run_cmd("systemctl restart azpool-imagedisplay.service", run_sudo=True)
    
    # 5. Wait 6 seconds
    print("Waiting 6 seconds...")
    time.sleep(6)
    
    # 6. Read log to see EGL/OpenGL Renderer
    run_cmd("tail -n 100 /var/log/azpool-imagedisplay.log")
    
    # 7. Check CPU usage of the process
    run_cmd("ps aux | grep -E 'python.*main.py|image-display'")

    ssh.close()

if __name__ == "__main__":
    main()
