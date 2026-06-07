import paramiko
import sys
import os
import time

def main():
    ip = "192.168.1.195"
    username = "azpoolarena"
    password = "admin"
    
    local_deb = "/home/wavy/web-azpoolarena/scoreboard/build/azpool-scoreboard_1.3.14_amd64.deb"
    remote_deb = "/tmp/azpool-scoreboard_1.3.14_amd64.deb"
    
    if not os.path.exists(local_deb):
        print(f"Error: Local deb package not found at {local_deb}")
        sys.exit(1)
        
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to Kiosk at {username}@{ip}...")
        ssh.connect(ip, username=username, password=password, timeout=20)
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)
        
    def run_cmd(cmd, run_sudo=False):
        if run_sudo:
            cmd = f"echo '{password}' | sudo -S {cmd}"
        print(f"Running: {cmd.replace(password, '*****') if password in cmd else cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        code = stdout.channel.recv_exit_status()
        if code != 0:
            print(f"Exit code: {code}")
            if out:
                print("STDOUT:", out.strip())
            if err:
                print("STDERR:", err.strip())
        return code, out, err

    # 1. Back up existing configuration files to /tmp
    print("\n--- Step 1: Backing up configuration files ---")
    run_cmd("mkdir -p /tmp/sb_backup")
    
    # Check if files exist and back them up
    has_env_backup = False
    has_cam_backup = False
    
    code, _, _ = run_cmd("[ -f /opt/azpool-scoreboard/.env ]")
    if code == 0:
        run_cmd("cp /opt/azpool-scoreboard/.env /tmp/sb_backup/.env", run_sudo=True)
        print("Backed up .env to /tmp/sb_backup/.env")
        has_env_backup = True
    else:
        print("Warning: No .env found to backup")
        
    code, _, _ = run_cmd("[ -f /opt/azpool-scoreboard/config/camera.json ]")
    if code == 0:
        run_cmd("cp /opt/azpool-scoreboard/config/camera.json /tmp/sb_backup/camera.json", run_sudo=True)
        print("Backed up camera.json to /tmp/sb_backup/camera.json")
        has_cam_backup = True
    else:
        print("Warning: No camera.json found to backup")

    # 2. Upload the new deb package
    print("\n--- Step 2: Uploading deb package via SFTP ---")
    try:
        sftp = ssh.open_sftp()
        sftp.put(local_deb, remote_deb)
        sftp.close()
        print(f"Uploaded {local_deb} to remote {remote_deb}")
    except Exception as e:
        print(f"SFTP Upload failed: {e}")
        ssh.close()
        sys.exit(1)

    # 3. Clean locks and install package
    print("\n--- Step 3: Installing package ---")
    install_commands = [
        "rm -f /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock /var/cache/apt/archives/lock",
        "dpkg --configure -a",
        f"dpkg -i {remote_deb}",
        "apt-get install -f -y"
    ]
    
    for cmd in install_commands:
        code, _, _ = run_cmd(cmd, run_sudo=True)
        if code != 0:
            print(f"Error during command execution: {cmd}")
            # Do not stop on dpkg -i errors as apt-get install -f will resolve them
            if "dpkg -i" not in cmd and "apt-get install" not in cmd:
                ssh.close()
                sys.exit(1)

    # 4. Restore configuration files if they were lost or overwritten
    print("\n--- Step 4: Restoring configuration files ---")
    if has_env_backup:
        # Check if .env was changed or missing
        code, _, _ = run_cmd("[ -f /opt/azpool-scoreboard/.env ]")
        if code != 0:
            print("Restoring .env from backup...")
            run_cmd("cp /tmp/sb_backup/.env /opt/azpool-scoreboard/.env", run_sudo=True)
            run_cmd("chown azscoreboard:azscoreboard /opt/azpool-scoreboard/.env", run_sudo=True)
        else:
            print(".env is intact, preserving it.")
            
    if has_cam_backup:
        code, _, _ = run_cmd("[ -f /opt/azpool-scoreboard/config/camera.json ]")
        if code != 0:
            print("Restoring camera.json from backup...")
            run_cmd("cp /tmp/sb_backup/camera.json /opt/azpool-scoreboard/config/camera.json", run_sudo=True)
            run_cmd("chown azscoreboard:azscoreboard /opt/azpool-scoreboard/config/camera.json", run_sudo=True)
        else:
            print("camera.json is intact, preserving it.")

    # 5. Clean up remote temp files
    print("\n--- Step 5: Cleaning up temp files ---")
    run_cmd(f"rm -f {remote_deb}")

    # 6. Reboot the system
    print("\n--- Step 6: Rebooting kiosk machine ---")
    try:
        run_cmd("reboot", run_sudo=True)
        time.sleep(2)
    except Exception:
        pass # Reboot usually drops connection
        
    ssh.close()
    print("\nDeployment completed successfully! Kiosk is rebooting.")

if __name__ == "__main__":
    main()
