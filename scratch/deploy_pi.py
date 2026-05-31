import paramiko
import os
import sys

def main():
    ip = "192.168.1.84"
    username = "poolarena"
    password = "admin"
    
    local_dir = "F:\\web-azpoolarena\\image-display"
    remote_dir = "/home/poolarena/image-display"
    
    print(f"=== Deploying Image Display to Raspberry Pi 5 ({ip}) ===")
    
    # 1. Connect SSH
    print(f"Connecting to {username}@{ip}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(ip, username=username, password=password, timeout=20)
        print("Connected successfully!")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)
        
    # 2. Pre-install dependencies on Pi (using precompiled apt packages for speed and stability)
    print("Installing system dependencies on Pi (python3-pyside6, requests, venv)...")
    commands = [
        # Clean locks if any
        f"echo '{password}' | sudo -S rm -f /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock /var/cache/apt/archives/lock",
        f"echo '{password}' | sudo -S dpkg --configure -a",
        # Update and install
        f"echo '{password}' | sudo -S apt-get update -y",
        f"echo '{password}' | sudo -S apt-get install -y python3-venv python3-pip python3-pyside6 python3-requests"
    ]
    
    for cmd in commands:
        cmd_display = cmd.split("sudo -S ")[1] if "sudo -S " in cmd else cmd
        print(f"Running on Pi: {cmd_display}...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            print(f"Warning: Command exited with status {exit_status}")
            
    # 3. Create remote directories
    print("Creating remote directories...")
    ssh.exec_command(f"mkdir -p {remote_dir}/fonts")
    
    # 4. SFTP Upload files
    print("Starting SFTP upload...")
    sftp = ssh.open_sftp()
    
    files_to_upload = [
        ("main.py", "main.py"),
        ("main.qml", "main.qml"),
        ("requirements.txt", "requirements.txt"),
        ("run.sh", "run.sh"),
        ("fonts/Montserrat-Bold.otf", "fonts/Montserrat-Bold.otf"),
        ("fonts/Montserrat-Italic.otf", "fonts/Montserrat-Italic.otf"),
        ("fonts/Montserrat-Regular.otf", "fonts/Montserrat-Regular.otf"),
    ]
    
    for local_rel, remote_rel in files_to_upload:
        local_path = os.path.join(local_dir, local_rel)
        remote_path = f"{remote_dir}/{remote_rel}"
        print(f"Uploading {local_rel} -> {remote_path}...")
        sftp.put(local_path, remote_path)
        
    sftp.close()
    print("SFTP upload completed successfully!")
    
    # 5. Set executable permissions on run.sh
    print("Setting permissions...")
    ssh.exec_command(f"chmod +x {remote_dir}/run.sh")
    
    # 6. Initialize virtual environment and install requirements
    print("Initializing virtual environment on Pi...")
    # Run in background or wait for it
    init_cmd = f"cd {remote_dir} && ./run.sh --help"
    print(f"Running test launch / venv initialization: {init_cmd}...")
    stdin, stdout, stderr = ssh.exec_command(init_cmd)
    exit_status = stdout.channel.recv_exit_status()
    print(f"Initialization finished with code: {exit_status}")
    
    # 7. Print remote folder structure to verify
    print("\nVerifying remote files:")
    stdin, stdout, stderr = ssh.exec_command(f"ls -la {remote_dir}")
    print(stdout.read().decode("utf-8"))
    
    ssh.close()
    print("=== Deployment to Raspberry Pi 5 Finished! ===")

if __name__ == "__main__":
    main()
