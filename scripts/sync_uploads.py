#!/usr/bin/env python3
"""
Sync production uploads directory from VPS (103.90.225.8)
to local dev backend/uploads.
"""

import os
import sys
import tarfile
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SERVER_HOST = "103.90.225.8"
SERVER_USER = "root"
SERVER_PASS = "hJHCQ8h1j0WjoctKwfpU"

REMOTE_UPLOADS = "/www/wwwroot/cms.poolarena.vn/backend/uploads"
REMOTE_TAR = "/tmp/azpool_uploads_prod.tar.gz"

LOCAL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_UPLOADS = os.path.join(LOCAL_ROOT, "backend", "uploads")
LOCAL_TAR = os.path.join(LOCAL_ROOT, "backend", "uploads_prod.tar.gz")

def run_ssh_cmd(client, cmd):
    print(f">> [Remote] {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if exit_status != 0:
        raise RuntimeError(f"Command failed ({exit_status}): {err}")
    return out

def main():
    print("=" * 60)
    print("  Sync Production Uploads / Images to Local Dev")
    print("=" * 60)

    # 1. Connect SSH
    print(f"\n[1/4] Connecting to {SERVER_HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=15)
    print("✓ SSH connected.")

    # 2. Archive remote uploads
    print(f"\n[2/4] Packaging {REMOTE_UPLOADS} on remote server...")
    run_ssh_cmd(client, f"tar -czf {REMOTE_TAR} -C {REMOTE_UPLOADS} .")
    size_out = run_ssh_cmd(client, f"ls -lh {REMOTE_TAR}").strip()
    print(f"Archive: {size_out}")

    # 3. Download via SFTP
    print(f"\n[3/4] Downloading {REMOTE_TAR} -> {LOCAL_TAR}...")
    sftp = client.open_sftp()
    sftp.get(REMOTE_TAR, LOCAL_TAR)
    sftp.close()

    # Clean up remote tar
    run_ssh_cmd(client, f"rm -f {REMOTE_TAR}")
    client.close()
    print(f"✓ Downloaded ({os.path.getsize(LOCAL_TAR)//1024} KB).")

    # 4. Extract locally
    print(f"\n[4/4] Extracting into {LOCAL_UPLOADS}...")
    os.makedirs(LOCAL_UPLOADS, exist_ok=True)
    with tarfile.open(LOCAL_TAR, "r:gz") as tar:
        tar.extractall(LOCAL_UPLOADS)
    
    # Remove local tar archive
    if os.path.exists(LOCAL_TAR):
        os.remove(LOCAL_TAR)

    print("✓ Extracted successfully.")

    # Summary
    file_count = sum(len(files) for _, _, files in os.walk(LOCAL_UPLOADS))
    print(f"\nLocal uploads now contains {file_count} files.")
    print("=" * 60)
    print("  UPLOADS SYNC SUCCESSFUL!")
    print("=" * 60)

if __name__ == "__main__":
    main()
