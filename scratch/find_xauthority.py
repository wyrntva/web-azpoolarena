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

    # 1. Search for Xauthority files under /run/user/1000/
    run_cmd("find /run/user/1000/ -name '*Xauthority*'", run_sudo=True)
    
    # 2. Check all files in /run/user/1000/gdm/
    run_cmd("ls -la /run/user/1000/gdm/", run_sudo=True)
    
    # 3. Check what auth file is used by the active Xorg process
    run_cmd("ps aux | grep Xorg")

    ssh.close()

if __name__ == "__main__":
    main()
