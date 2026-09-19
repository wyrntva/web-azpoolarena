#!/usr/bin/env python3
"""
Fetch latest database from production server (103.90.225.8)
and restore it into local dev postgres container (azpool-db-dev).
"""

import os
import sys
import time
import subprocess
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SERVER_HOST = "103.90.225.8"
SERVER_USER = "root"
SERVER_PASS = "hJHCQ8h1j0WjoctKwfpU"

LOCAL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUMP_REMOTE_PATH = "/tmp/azpool_prod_latest.dump"
SQL_REMOTE_PATH = "/tmp/azpool_prod_latest.sql"
LOCAL_DUMP_PATH = os.path.join(LOCAL_ROOT, "backup_production_latest.dump")
LOCAL_SQL_PATH = os.path.join(LOCAL_ROOT, "backup_production_latest.sql")

def run_ssh_cmd(client, cmd):
    print(f">> [Remote] {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if exit_status != 0:
        print(f"Error ({exit_status}): {err}")
        raise RuntimeError(f"Command failed with exit code {exit_status}: {err}")
    return out

def main():
    print("=" * 60)
    print("  Sync Production Database to Local Dev")
    print("=" * 60)

    # 1. Connect to production server
    print(f"\n[1/5] Connecting to {SERVER_HOST} via SSH...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=15)
    print("✓ SSH connected successfully.")

    # 2. Check DB config on prod
    print("\n[2/5] Inspecting production database container...")
    env_out = run_ssh_cmd(client, "docker inspect azpool-db-prod --format '{{json .Config.Env}}'")
    print(f"DB Env: {env_out.strip()}")

    # Determine DB user and DB name
    # Default in docker-compose.prod.yml
    db_name = "poolarena"
    db_user = "postgres"
    if "POSTGRES_DB=azpoolarena" in env_out:
        db_name = "azpoolarena"
    elif "POSTGRES_DB=poolarena" in env_out:
        db_name = "poolarena"

    if "POSTGRES_USER=poolarena" in env_out:
        db_user = "poolarena"

    print(f"Using DB: {db_name}, User: {db_user}")

    # 3. Dump database on production server
    # We do custom format dump (pg_dump -Fc) for reliable restore, and text sql as well
    print(f"\n[3/5] Dumping database {db_name} from azpool-db-prod...")
    run_ssh_cmd(client, f"docker exec azpool-db-prod pg_dump -U {db_user} -d {db_name} -Fc > {DUMP_REMOTE_PATH}")
    run_ssh_cmd(client, f"docker exec azpool-db-prod pg_dump -U {db_user} -d {db_name} --clean --if-exists > {SQL_REMOTE_PATH}")
    
    dump_size = run_ssh_cmd(client, f"ls -lh {DUMP_REMOTE_PATH} {SQL_REMOTE_PATH}").strip()
    print(f"Dump files created on remote:\n{dump_size}")

    # 4. Download dump files via SFTP
    print(f"\n[4/5] Downloading dump files to {LOCAL_ROOT}...")
    sftp = client.open_sftp()
    
    print(f"Downloading {DUMP_REMOTE_PATH} -> {LOCAL_DUMP_PATH}...")
    sftp.get(DUMP_REMOTE_PATH, LOCAL_DUMP_PATH)
    
    print(f"Downloading {SQL_REMOTE_PATH} -> {LOCAL_SQL_PATH}...")
    sftp.get(SQL_REMOTE_PATH, LOCAL_SQL_PATH)
    sftp.close()

    # Clean up remote temp files
    run_ssh_cmd(client, f"rm -f {DUMP_REMOTE_PATH} {SQL_REMOTE_PATH}")
    client.close()
    print("✓ Download complete.")

    # 5. Restore into local azpool-db-dev container
    print("\n[5/5] Restoring database into local container 'azpool-db-dev'...")
    # Copy dump file into container
    print("Copying dump into azpool-db-dev container...")
    subprocess.run(["docker", "cp", LOCAL_DUMP_PATH, "azpool-db-dev:/tmp/restore.dump"], check=True)

    # Terminate active connections to azpoolarena so drop/restore succeeds
    print("Terminating existing connections to azpoolarena...")
    kill_conn_sql = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'azpoolarena' AND pid <> pg_backend_pid();"
    subprocess.run([
        "docker", "exec", "azpool-db-dev", "psql", "-U", "postgres", "-d", "postgres",
        "-c", kill_conn_sql
    ], check=True)

    # Drop and recreate database for clean slate
    print("Recreating database 'azpoolarena'...")
    subprocess.run([
        "docker", "exec", "azpool-db-dev", "psql", "-U", "postgres", "-d", "postgres",
        "-c", "DROP DATABASE IF EXISTS azpoolarena;"
    ], check=True)
    subprocess.run([
        "docker", "exec", "azpool-db-dev", "psql", "-U", "postgres", "-d", "postgres",
        "-c", "CREATE DATABASE azpoolarena;"
    ], check=True)

    # Restore with pg_restore
    print("Running pg_restore...")
    res = subprocess.run([
        "docker", "exec", "azpool-db-dev", "pg_restore", "-U", "postgres", "-d", "azpoolarena",
        "--no-owner", "--no-acl", "/tmp/restore.dump"
    ], capture_output=True, text=True)
    
    # pg_restore often returns 1 for warnings (like schema exists etc), which is normal
    if res.returncode not in [0, 1]:
        print(f"pg_restore warning/error (code {res.returncode}): {res.stderr}")
    else:
        print("pg_restore finished successfully!")

    # Cleanup temp in container
    subprocess.run(["docker", "exec", "azpool-db-dev", "rm", "-f", "/tmp/restore.dump"], check=True)

    # Restart backend container to clear cache / re-initialize typeorm connections
    print("Restarting local backend container 'azpool-backend-dev'...")
    subprocess.run(["docker", "restart", "azpool-backend-dev"], check=True)

    # Check row count in local database
    print("\nVerifying local database:")
    count_check = subprocess.run([
        "docker", "exec", "azpool-db-dev", "psql", "-U", "postgres", "-d", "azpoolarena",
        "-c", "SELECT 'tournaments' AS tbl, count(*) FROM tournaments UNION ALL SELECT 'tournament_matches', count(*) FROM tournament_matches UNION ALL SELECT 'tournament_registrations', count(*) FROM tournament_registrations UNION ALL SELECT 'users', count(*) FROM users;"
    ], capture_output=True, text=True, check=True)
    print(count_check.stdout)

    print("\n" + "=" * 60)
    print("  DATABASE SYNC SUCCESSFUL!")
    print("=" * 60)

if __name__ == "__main__":
    main()
