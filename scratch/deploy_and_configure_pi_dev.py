import paramiko
import os
import time
import sys

def main():
    ip = "192.168.1.84"
    username = "poolarena"
    password = "admin"
    
    local_dir = "/home/wavy/web-azpoolarena/image-display"
    remote_dir = "/home/poolarena/image-display"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    connected = False
    max_attempts = 50
    sleep_seconds = 5
    
    print(f"Connecting to {username}@{ip} (up to {max_attempts} attempts, sleeping {sleep_seconds}s between)...")
    for attempt in range(1, max_attempts + 1):
        try:
            ssh.connect(ip, username=username, password=password, timeout=10)
            print(f"Connected successfully on attempt {attempt}!")
            connected = True
            break
        except Exception as e:
            print(f"Attempt {attempt} failed: {e}. Sleeping...")
            time.sleep(sleep_seconds)
            
    if not connected:
        print("Could not connect to Pi.")
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
            print("STDOUT:")
            print(out.strip())
        if err:
            print("STDERR:")
            print(err.strip())
        return code, out, err

    # 1. Create remote directories
    run_cmd(f"mkdir -p {remote_dir}/fonts")
    
    # 2. SFTP Upload files
    print("Starting SFTP upload...")
    sftp = ssh.open_sftp()
    
    files_to_upload = [
        ("main.py", "main.py"),
        ("main.qml", "main.qml"),
        ("requirements.txt", "requirements.txt"),
        ("run.sh", "run.sh"),
        ("default_banner.png", "default_banner.png"),
        ("fonts/Montserrat-Bold.otf", "fonts/Montserrat-Bold.otf"),
        ("fonts/Montserrat-Italic.otf", "fonts/Montserrat-Italic.otf"),
        ("fonts/Montserrat-Regular.otf", "fonts/Montserrat-Regular.otf"),
    ]
    
    for local_rel, remote_rel in files_to_upload:
        local_path = os.path.join(local_dir, local_rel)
        remote_path = f"{remote_dir}/{remote_rel}"
        if os.path.exists(local_path):
            print(f"Uploading {local_rel} -> {remote_path}...")
            sftp.put(local_path, remote_path)
        else:
            print(f"Warning: local file {local_path} does not exist!")
            
    sftp.close()
    print("SFTP upload completed successfully!")
    
    # 3. Copy files to /opt/azpool-imagedisplay
    print("\nCopying new files to /opt/azpool-imagedisplay...")
    run_cmd(f"cp -f {remote_dir}/main.py /opt/azpool-imagedisplay/main.py", run_sudo=True)
    run_cmd(f"cp -f {remote_dir}/main.qml /opt/azpool-imagedisplay/main.qml", run_sudo=True)
    run_cmd(f"cp -f {remote_dir}/requirements.txt /opt/azpool-imagedisplay/requirements.txt", run_sudo=True)
    run_cmd(f"cp -f {remote_dir}/run.sh /opt/azpool-imagedisplay/run.sh", run_sudo=True)
    run_cmd(f"cp -f {remote_dir}/default_banner.png /opt/azpool-imagedisplay/default_banner.png", run_sudo=True)
    
    # Copy fonts
    run_cmd("mkdir -p /opt/azpool-imagedisplay/fonts", run_sudo=True)
    run_cmd(f"cp -f {remote_dir}/fonts/* /opt/azpool-imagedisplay/fonts/", run_sudo=True)
    
    # 4. Set owner and permissions
    run_cmd("chown -R poolarena:poolarena /opt/azpool-imagedisplay", run_sudo=True)
    run_cmd("chmod +x /opt/azpool-imagedisplay/run.sh /opt/azpool-imagedisplay/kiosk-run.sh", run_sudo=True)
    
    # 5. Overwrite .env with local dev API URL (192.168.1.188:8000)
    dev_env_content = """# ==============================================================================
# Environment variables for Image Display
# ==============================================================================
API_BASE_URL=http://192.168.1.188:8000
"""
    write_cmd = f"echo '{dev_env_content}' | tee /opt/azpool-imagedisplay/.env"
    run_cmd(write_cmd)
    
    # Double check content of .env
    run_cmd("cat /opt/azpool-imagedisplay/.env")
    
    # 6. Restart the service to apply changes
    run_cmd("systemctl restart azpool-imagedisplay.service", run_sudo=True)
    
    # Wait for the service to start
    print("Waiting 5s for service to restart...")
    time.sleep(5)
    
    # 7. Check service status and recent journal logs
    run_cmd("systemctl status azpool-imagedisplay.service")
    run_cmd("journalctl -u azpool-imagedisplay.service -n 50")
    
    # Check if the process is running
    run_cmd("ps aux | grep -E 'python.*main.py|image-display'")
    
    ssh.close()

if __name__ == "__main__":
    main()
