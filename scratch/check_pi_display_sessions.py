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
    max_attempts = 20
    
    for attempt in range(1, max_attempts + 1):
        try:
            ssh.connect(ip, username=username, password=password, timeout=5)
            connected = True
            break
        except Exception:
            time.sleep(2)
            
    if not connected:
        print("Could not connect to Pi.")
        sys.exit(1)
        
    def run_cmd(cmd):
        print(f"\nRunning: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        print("STDOUT:", out.strip())
        print("STDERR:", err.strip())

    run_cmd("w")
    run_cmd("ps aux | grep -iE 'Xorg|Xwayland|wayland|session|dm|lightdm|gdm'")
    run_cmd("ls -la /tmp/.X11-unix")
    ssh.close()

if __name__ == "__main__":
    main()
