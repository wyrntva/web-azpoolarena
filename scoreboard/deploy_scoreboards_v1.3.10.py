import paramiko
import os
import sys
import time

# IP list provided by the user
ips = [
    "192.168.1.51", "192.168.1.133", "192.168.1.252", "192.168.1.91",
    "192.168.1.165", "192.168.1.195", "192.168.1.122", "192.168.1.192",
    "192.168.1.12", "192.168.1.73", "192.168.1.61", "192.168.1.233"
]

deb_file_local = "/home/wavy/web-azpoolarena/scoreboard/build/azpool-scoreboard_1.3.10_amd64.deb"
deb_file_remote = "/tmp/azpool-scoreboard_1.3.10_amd64.deb"

username = "azpoolarena"
password = "admin"

print(f"Deploying {deb_file_local} to {len(ips)} machines...")

for ip in ips:
    print(f"\n[{ip}] Connecting...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=20)
        
        print(f"[{ip}] Uploading deb package...")
        ftp_client = ssh.open_sftp()
        ftp_client.put(deb_file_local, deb_file_remote)
        ftp_client.close()
        
        # Robust install: clean locks, configure pending, install package, fix dependencies
        commands = [
            f"echo '{password}' | sudo -S rm -f /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock /var/cache/apt/archives/lock",
            f"echo '{password}' | sudo -S dpkg --configure -a",
            f"echo '{password}' | sudo -S dpkg --purge azpool-scoreboard",
            f"echo '{password}' | sudo -S dpkg -i {deb_file_remote}",
            f"echo '{password}' | sudo -S apt-get install -f -y"
        ]
        
        for cmd in commands:
            cmd_display = cmd.split('sudo -S ')[1]
            print(f"[{ip}] Running: {cmd_display}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                print(f"[{ip}] Machine warning: '{cmd_display}' exited with {exit_status}")
            
        print(f"[{ip}] Rebooting system...")
        try:
            ssh.exec_command(f"echo '{password}' | sudo -S reboot")
            time.sleep(1)
        except Exception:
            pass # Reboot command usually drops the connection
            
        ssh.close()
        print(f"[{ip}] ✅ Done.")
        
    except Exception as e:
        print(f"[{ip}] ❌ Failed: {e}")

print("\nDeployment completed.")
