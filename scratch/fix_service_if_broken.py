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
    for attempt in range(1, 11):
        try:
            ssh.connect(ip, username=username, password=password, timeout=10)
            connected = True
            break
        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")
            time.sleep(2)
            
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

    # Check current service content
    code, out, _ = run_cmd("cat /etc/systemd/system/azpool-imagedisplay.service")
    
    # If file is empty or does not contain kiosk-run.sh, rewrite it!
    if code != 0 or len(out.strip()) < 50 or "kiosk-run.sh" not in out:
        print("\n[!] Service file is missing or corrupted! Overwriting with correct content...")
        correct_service = """[Unit]
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
        escaped_service = correct_service.replace('"', '\\"')
        run_cmd(f'echo "{escaped_service}" | sudo tee /etc/systemd/system/azpool-imagedisplay.service', run_sudo=True)
        run_cmd("sudo chmod 644 /etc/systemd/system/azpool-imagedisplay.service", run_sudo=True)
        run_cmd("sudo systemctl daemon-reload", run_sudo=True)
        run_cmd("sudo systemctl restart azpool-imagedisplay.service", run_sudo=True)
        print("Service file restored and restarted successfully!")
    else:
        print("\n[+] Service file is correct.")
        
    # Check status
    run_cmd("systemctl status azpool-imagedisplay.service")

    ssh.close()

if __name__ == "__main__":
    main()
