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

    # 1. Run xhost + as wavy user to authorize connections to display :0
    # We use XAUTHORITY pointing to wavy's Xauthority file
    run_cmd("sudo -u wavy DISPLAY=:0 XAUTHORITY=/run/user/1000/gdm/Xauthority xhost +", run_sudo=True)
    
    # 2. Restart the systemd service
    run_cmd("systemctl restart azpool-imagedisplay.service", run_sudo=True)
    
    # 3. Wait 5 seconds for startup
    print("Waiting 5 seconds for service to restart...")
    time.sleep(5)
    
    # 4. Check the logs
    run_cmd("tail -n 30 /var/log/azpool-imagedisplay.log")
    
    ssh.close()

if __name__ == "__main__":
    main()
