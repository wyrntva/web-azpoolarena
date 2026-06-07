import os
import hashlib
import paramiko

def get_local_md5s(base_dir):
    md5s = {}
    for root, dirs, files in os.walk(base_dir):
        # ignore build, venv, runtime, cache, __pycache__
        if any(p in root for p in ['/build', '/venv', '/runtime', '/cache', '__pycache__', '/.git']):
            continue
        for f in files:
            if f.endswith('.py') or f.endswith('.qml') or f == 'VERSION' or f == 'kiosk-run.sh':
                path = os.path.join(root, f)
                rel_path = os.path.relpath(path, base_dir)
                with open(path, 'rb') as fp:
                    data = fp.read()
                    md5s[rel_path] = hashlib.md5(data).hexdigest()
    return md5s

def main():
    local_dir = "/home/wavy/web-azpoolarena/scoreboard"
    ip = "192.168.1.195"
    username = "azpoolarena"
    password = "admin"
    
    local_md5s = get_local_md5s(local_dir)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(ip, username=username, password=password, timeout=10)
    except Exception as e:
        print(f"Failed to connect: {e}")
        return
        
    remote_dir = "/opt/azpool-scoreboard"
    
    # We will get md5sum on the remote machine
    # Let's list python and qml files on remote
    cmd = f"find {remote_dir} -type f \\( -name '*.py' -o -name '*.qml' -o -name 'VERSION' -o -name 'kiosk-run.sh' \\) -not -path '*/venv/*' -not -path '*/__pycache__/*'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    remote_files = stdout.read().decode('utf-8', errors='ignore').splitlines()
    
    remote_md5s = {}
    for r_file in remote_files:
        r_file = r_file.strip()
        if not r_file:
            continue
        rel_path = os.path.relpath(r_file, remote_dir)
        # run md5sum
        stdin, stdout, stderr = ssh.exec_command(f"md5sum {r_file}")
        md5_line = stdout.read().decode('utf-8', errors='ignore').strip()
        if md5_line:
            md5_val = md5_line.split()[0]
            remote_md5s[rel_path] = md5_val
            
    ssh.close()
    
    print("=== FILE COMPARISON ===")
    all_keys = set(local_md5s.keys()).union(set(remote_md5s.keys()))
    
    different = []
    only_local = []
    only_remote = []
    identical = []
    
    for k in sorted(all_keys):
        if k in local_md5s and k in remote_md5s:
            if local_md5s[k] == remote_md5s[k]:
                identical.append(k)
            else:
                different.append(k)
        elif k in local_md5s:
            only_local.append(k)
        else:
            only_remote.append(k)
            
    print(f"Identical files: {len(identical)}")
    if only_local:
        print("\nOnly in local workspace:")
        for k in only_local:
            print(f"  + {k}")
    if only_remote:
        print("\nOnly on remote machine:")
        for k in only_remote:
            print(f"  - {k}")
    if different:
        print("\nDifferent files:")
        for k in different:
            print(f"  * {k}")
            
if __name__ == "__main__":
    main()
