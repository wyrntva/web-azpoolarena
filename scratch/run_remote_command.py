import paramiko
import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python run_remote_command.py <command> [--sudo]")
        sys.exit(1)
        
    cmd = sys.argv[1]
    run_sudo = "--sudo" in sys.argv
    
    ip = "192.168.1.84"
    username = "poolarena"
    password = "admin"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(ip, username=username, password=password, timeout=10)
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)
        
    if run_sudo:
        cmd = f"echo '{password}' | sudo -S {cmd}"
        
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for the command to finish
    exit_status = stdout.channel.recv_exit_status()
    
    out = stdout.read()
    err = stderr.read()
    
    ssh.close()
    
    print(f"=== Command Exited with status: {exit_status} ===")
    if out:
        sys.stdout.buffer.write(out)
    if err:
        sys.stderr.buffer.write(err)

if __name__ == "__main__":
    main()
