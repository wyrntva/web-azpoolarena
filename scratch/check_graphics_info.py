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

    # 1. Back up systemd service
    run_cmd("cp /etc/systemd/system/azpool-imagedisplay.service /tmp/azpool-imagedisplay.service.bak", run_sudo=True)
    
    # 2. Add QSG_INFO=1 to service to output graphics pipeline details
    # We will read the service, modify it, and write it back
    _, out, _ = run_cmd("cat /etc/systemd/system/azpool-imagedisplay.service")
    lines = out.strip().split('\n')
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if "Environment=DISPLAY=:0" in line:
            new_lines.append("Environment=QSG_INFO=1")
            
    new_service_content = '\n'.join(new_lines)
    escaped_service = new_service_content.replace('"', '\\"')
    run_cmd(f'echo "{escaped_service}" | sudo tee /etc/systemd/system/azpool-imagedisplay.service', run_sudo=True)
    
    # 3. Reload systemd and restart service
    run_cmd("systemctl daemon-reload", run_sudo=True)
    run_cmd("systemctl restart azpool-imagedisplay.service", run_sudo=True)
    
    # 4. Wait a few seconds
    print("Waiting 5 seconds...")
    time.sleep(5)
    
    # 5. Read log to see GPU/OpenGL info
    run_cmd("tail -n 100 /var/log/azpool-imagedisplay.log")
    
    # 6. Restore original service (removing QSG_INFO=1 to keep it clean, or we can keep it if helpful)
    # Let's restore it so we don't leave temporary edits
    run_cmd("cp /tmp/azpool-imagedisplay.service.bak /etc/systemd/system/azpool-imagedisplay.service", run_sudo=True)
    run_cmd("systemctl daemon-reload", run_sudo=True)
    run_cmd("systemctl restart azpool-imagedisplay.service", run_sudo=True)

    ssh.close()

if __name__ == "__main__":
    main()
