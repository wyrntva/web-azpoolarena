import sys
import paramiko

def run_ssh_command(host, port, username, password, command):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=host, port=port, username=username, password=password, timeout=10)
        stdin, stdout, stderr = client.exec_command(command)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        print("--- STDOUT ---")
        print(out)
        print("--- STDERR ---")
        print(err)
    except Exception as e:
        print(f"Error connecting or executing: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ssh_run.py <command>")
        sys.exit(1)
    cmd = sys.argv[1]
    run_ssh_command("192.168.1.165", 22, "azpoolarena", "admin", cmd)
