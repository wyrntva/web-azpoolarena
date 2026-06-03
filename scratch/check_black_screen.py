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
    for attempt in range(1, 11): # Try up to 10 times because of connection reset
        try:
            print(f"Connecting to {username}@{ip} (attempt {attempt})...")
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

    # 1. Check systemd status
    run_cmd("systemctl status azpool-imagedisplay.service")
    
    # 2. Check the app log file
    run_cmd("tail -n 100 /var/log/azpool-imagedisplay.log")
    
    # 3. Check system journal log
    run_cmd("journalctl -u azpool-imagedisplay.service -n 50 --no-pager")
    
    # 4. Check what display server is running (Xorg or Wayland)
    run_cmd("ps aux | grep -iE 'xorg|wayland|weston|gdm'")
    
    # 5. Check display environment variables and permissions
    run_cmd("ls -la /run/user/1000/gdm/Xauthority", run_sudo=True)
    
    # 6. Check who is logged in graphically
    run_cmd("who")
    
    ssh.close()

if __name__ == "__main__":
    main()
