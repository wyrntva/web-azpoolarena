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
            print("Connected successfully!")
            connected = True
            break
        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")
            time.sleep(3)
            
    if not connected:
        print("Could not connect to Pi after 5 attempts.")
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

    # 1. Check running processes for image-display
    run_cmd("ps aux | grep -E 'python.*main.py|image-display'")
    
    # 2. Check files in /opt/azpool-imagedisplay
    run_cmd("ls -la /opt/azpool-imagedisplay")
    
    # 3. Check if there are any .env files or config files in /opt/azpool-imagedisplay
    run_cmd("ls -la /opt/azpool-imagedisplay/.env")
    run_cmd("cat /opt/azpool-imagedisplay/.env")
    
    # 4. Check systemd services
    run_cmd("systemctl list-units --type=service | grep -iE 'pool|img|display|kiosk'")
    run_cmd("ls -la /etc/systemd/system/ | grep -iE 'pool|img|display|kiosk'")
    
    # 5. Check if there is an environment variable configuration in systemd service if it exists
    # Let's search for service files
    _, out, _ = run_cmd("ls /etc/systemd/system/ | grep -iE 'img|display|kiosk'")
    for service_file in out.strip().split('\n'):
        service_file = service_file.strip()
        if service_file:
            run_cmd(f"cat /etc/systemd/system/{service_file}", run_sudo=True)
            
    # 6. Check if /home/poolarena/image-display has any .env
    run_cmd("ls -la /home/poolarena/image-display/.env")
    run_cmd("cat /home/poolarena/image-display/.env")

    ssh.close()

if __name__ == "__main__":
    main()
