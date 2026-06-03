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

    # Check env file content
    run_cmd("cat /opt/azpool-imagedisplay/.env")
    
    # Check service file content
    run_cmd("cat /etc/systemd/system/azpool-imagedisplay.service")
    
    # Check if API_BASE_URL env is set for running python processes
    run_cmd("strings /proc/$(pgrep -f 'python /opt/azpool-imagedisplay/main.py')/environ | grep API_BASE_URL", run_sudo=True)

    ssh.close()

if __name__ == "__main__":
    main()
