import paramiko
import sys
import time

def main():
    ip = "192.168.1.195"
    username = "azpoolarena"
    password = "admin"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    # Try connecting up to 10 times with delay (since the machine was rebooting)
    connected = False
    for attempt in range(1, 11):
        try:
            print(f"Connecting to {username}@{ip} (attempt {attempt}/10)...")
            ssh.connect(ip, username=username, password=password, timeout=10)
            print("Connected successfully!")
            connected = True
            break
        except Exception as e:
            print(f"Attempt failed: {e}")
            time.sleep(10)
            
    if not connected:
        print("Could not connect to Kiosk after 10 attempts.")
        sys.exit(1)
        
    def run_cmd(cmd, run_sudo=False):
        if run_sudo:
            cmd = f"echo '{password}' | sudo -S {cmd}"
        print(f"\n--- Running: {cmd} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()
        code = stdout.channel.recv_exit_status()
        print(f"Exit code: {code}")
        if out:
            print("STDOUT:")
            print(out)
        if err:
            print("STDERR:")
            print(err)
        return code, out, err

    # 1. Check installed dpkg package
    run_cmd("dpkg -l | grep azpool-scoreboard")
    
    # 2. Check version file in opt directory
    run_cmd("cat /opt/azpool-scoreboard/VERSION")
    
    # 3. Check env file
    run_cmd("cat /opt/azpool-scoreboard/.env")
    
    # 4. Check available space
    run_cmd("df -h /")
    
    # 5. Check all systemd services related to azpool
    run_cmd("systemctl list-units --type=service | grep -i azpool")
    run_cmd("systemctl status azpool-cam-delay.service")
    run_cmd("systemctl status azpool-cam-record.service")
    run_cmd("systemctl status azpool-cam-prune.timer")
    
    # 6. Check running processes
    run_cmd("ps aux | grep -iE 'app.py|azpool'")
    
    ssh.close()

if __name__ == "__main__":
    main()
