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

    # 1. Print passwd entries for UID 1000 and poolarena
    run_cmd("cat /etc/passwd | grep -E '1000|poolarena|azimgdisplay'")
    
    # 2. Check if we can run as the graphical user
    # Let's find who owns /run/user/1000/gdm/Xauthority
    run_cmd("ls -ln /run/user/1000/gdm/Xauthority", run_sudo=True)
    
    # 3. Check if there are environment variables we can set to enable hardware acceleration for azimgdisplay
    # Sometimes setting LIBGL_ALWAYS_SOFTWARE=0 or QT_XCB_GL_SUBOPTIMAL-type vars works.
    # Actually, if we run the service as the graphical user (UID 1000), it will use hardware acceleration automatically.
    
    ssh.close()

if __name__ == "__main__":
    main()
