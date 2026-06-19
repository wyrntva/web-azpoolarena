import sys
import os
import paramiko

def deploy_to_165(files_dict):
    ip = "192.168.1.165"
    username = "azpoolarena"
    password = "admin"
    remote_app_dir = "/opt/azpool-scoreboard"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print(f"Connecting to {ip}...")
        ssh.connect(ip, username=username, password=password, timeout=15)
        sftp = ssh.open_sftp()

        # Create remote temp directory
        ssh.exec_command("mkdir -p /tmp/sb_up/qml/components /tmp/sb_up/qml/pages /tmp/sb_up/qml/utils /tmp/sb_up")

        for local_rel_path, remote_rel_path in files_dict.items():
            print(f"Uploading {local_rel_path} to tmp...")
            local_path = os.path.abspath(local_rel_path)
            remote_tmp = f"/tmp/sb_up/{remote_rel_path}"
            
            # Make sure remote dir exists in tmp
            remote_tmp_dir = os.path.dirname(remote_tmp)
            ssh.exec_command(f"mkdir -p {remote_tmp_dir}")
            
            sftp.put(local_path, remote_tmp)

        sftp.close()
        print("Upload completed.")

        # Copy to destination using sudo
        for local_rel_path, remote_rel_path in files_dict.items():
            dest_path = f"{remote_app_dir}/{remote_rel_path}"
            dest_dir = os.path.dirname(dest_path)
            print(f"Copying to {dest_path}...")
            
            # Ensure destination directory exists
            ssh.exec_command(f"echo '{password}' | sudo -S mkdir -p {dest_dir}")
            
            # Copy file
            cmd = f"echo '{password}' | sudo -S cp /tmp/sb_up/{remote_rel_path} {dest_path}"
            _, stdout, stderr = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
            
            # Fix ownership
            cmd_chown = f"echo '{password}' | sudo -S chown -R azscoreboard:azscoreboard {dest_path}"
            ssh.exec_command(cmd_chown)[1].channel.recv_exit_status()

        # Clean up tmp
        ssh.exec_command(f"echo '{password}' | sudo -S rm -rf /tmp/sb_up")

        # Restart app
        print("Restarting app...")
        cmd_restart = f"echo '{password}' | sudo -S pkill -f 'python.*app.py'"
        _, stdout, _ = ssh.exec_command(cmd_restart)
        stdout.channel.recv_exit_status()
        print("[OK] Restarted successfully!")

    except Exception as e:
        print(f"Error during deployment: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 deploy_to_165.py <local_path> <remote_path> [<local_path2> <remote_path2> ...]")
        sys.exit(1)
    
    files = {}
    for i in range(1, len(sys.argv), 2):
        if i+1 < len(sys.argv):
            files[sys.argv[i]] = sys.argv[i+1]
            
    deploy_to_165(files)
