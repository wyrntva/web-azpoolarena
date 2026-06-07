import paramiko
import sys

def main():
    ip = "192.168.1.195"
    username = "azpoolarena"
    password = "admin"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print(f"Connecting to {username}@{ip}...")
        ssh.connect(ip, username=username, password=password, timeout=10)
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
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

    # Check installed dpkg package
    run_cmd("dpkg -l | grep azpool-scoreboard")
    
    # Check version file in opt directory
    run_cmd("cat /opt/azpool-scoreboard/VERSION")
    
    # Check env file in opt directory
    run_cmd("cat /opt/azpool-scoreboard/.env")

    # Check config directory
    run_cmd("ls -la /opt/azpool-scoreboard/config")
    
    # Check systemd services running
    run_cmd("systemctl status azpool-scoreboard")
    run_cmd("systemctl list-units --type=service | grep -i azpool")
    
    # Check running processes
    run_cmd("ps aux | grep -iE 'app.py|azpool'")

    # Check network listening ports (like clip server, HLS delay server)
    run_cmd("ss -tlnp | grep -iE 'python|python3'")
    
    ssh.close()

if __name__ == "__main__":
    main()
