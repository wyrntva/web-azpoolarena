import paramiko
import sys

def main():
    ip = "192.168.1.84"
    username = "poolarena"
    password = "admin"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(ip, username=username, password=password, timeout=10)
        print("Connected to Pi!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)
        
    def run_cmd(cmd, run_sudo=False):
        if run_sudo:
            cmd = f"echo '{password}' | sudo -S {cmd}"
        print(f"\nRunning: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        code = stdout.channel.recv_exit_status()
        print(f"Exit code: {code}")
        if out:
            print("STDOUT:", out.strip())
        if err:
            print("STDERR:", err.strip())
        return code, out, err

    # 1. Back up existing /opt/azpool-imagedisplay
    print("\n--- Step 1: Backing up existing /opt/azpool-imagedisplay ---")
    run_cmd("rm -rf /opt/azpool-imagedisplay.backup", run_sudo=True)
    run_cmd("cp -r /opt/azpool-imagedisplay /opt/azpool-imagedisplay.backup", run_sudo=True)
    
    # 2. Copy files from /home/poolarena/image-display to /opt/azpool-imagedisplay
    print("\n--- Step 2: Copying new files to /opt/azpool-imagedisplay ---")
    # Copy all files except the venv folder and .env file to preserve environment
    run_cmd("cp -f /home/poolarena/image-display/main.py /opt/azpool-imagedisplay/main.py", run_sudo=True)
    run_cmd("cp -f /home/poolarena/image-display/main.qml /opt/azpool-imagedisplay/main.qml", run_sudo=True)
    run_cmd("cp -f /home/poolarena/image-display/requirements.txt /opt/azpool-imagedisplay/requirements.txt", run_sudo=True)
    run_cmd("cp -f /home/poolarena/image-display/run.sh /opt/azpool-imagedisplay/run.sh", run_sudo=True)
    
    # Copy fonts
    run_cmd("mkdir -p /opt/azpool-imagedisplay/fonts", run_sudo=True)
    run_cmd("cp -f /home/poolarena/image-display/fonts/* /opt/azpool-imagedisplay/fonts/", run_sudo=True)
    
    # 3. Adjust ownership and permissions
    print("\n--- Step 3: Setting correct owner and permissions ---")
    run_cmd("chown -R poolarena:poolarena /opt/azpool-imagedisplay", run_sudo=True)
    run_cmd("chmod +x /opt/azpool-imagedisplay/run.sh /opt/azpool-imagedisplay/kiosk-run.sh", run_sudo=True)
    
    # 4. Verify /opt files
    print("\n--- Step 4: Verifying deployed files ---")
    run_cmd("ls -la /opt/azpool-imagedisplay", run_sudo=True)
    run_cmd("ls -la /opt/azpool-imagedisplay/fonts", run_sudo=True)
    
    # 5. Restart the application process
    print("\n--- Step 5: Restarting the image-display application service ---")
    run_cmd("systemctl restart azpool-imagedisplay.service", run_sudo=True)
    
    # 6. Verify if it restarted successfully
    print("\n--- Step 6: Verifying new process status ---")
    import time
    time.sleep(4) # Wait for it to start
    run_cmd("systemctl status azpool-imagedisplay.service")
    run_cmd("ps aux | grep -E 'python.*main.py|image-display'")
    
    ssh.close()
    print("\n=== App deployment and restart finished! ===")

if __name__ == "__main__":
    main()
