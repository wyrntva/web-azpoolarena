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
        print(f"\n--- Running: {cmd} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        code = stdout.channel.recv_exit_status()
        print(f"Exit code: {code}")
        if out:
            print("STDOUT:")
            print(out)
        if err:
            print("STDERR:")
            print(err)
        return code, out, err

    # 1. Check Python installation and version
    run_cmd("python3 --version")
    
    # 2. Check if PySide6 or pyside6-lupdate are present
    run_cmd("pip3 list | grep -i pyside")
    run_cmd("python3 -c 'import PySide6; print(PySide6.__version__)'")
    
    # 3. Check what happens during APT install
    run_cmd("apt-get update -y", run_sudo=True)
    run_cmd("apt-get install -y python3-venv python3-pip python3-pyside6 python3-requests", run_sudo=True)
    
    # 4. Check run.sh line endings and content
    run_cmd("file /home/poolarena/image-display/run.sh")
    
    # 5. Fix run.sh line endings just in case using sed
    run_cmd("sed -i 's/\\r$//' /home/poolarena/image-display/run.sh")
    
    # 6. Run run.sh with help
    run_cmd("/home/poolarena/image-display/run.sh --help")
    
    ssh.close()

if __name__ == "__main__":
    main()
