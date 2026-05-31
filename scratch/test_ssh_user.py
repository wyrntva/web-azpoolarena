import paramiko

def try_auth():
    ip = "192.168.1.84"
    password = "admin"
    users = ["ubuntu", "poolarena", "orangepi", "user", "debian", "cooca", "pi", "wavy", "azpoolarena"]
    
    print("Testing SSH logins for:", ip)
    for user in users:
        print(f"Trying username: '{user}'...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            ssh.connect(ip, username=user, password=password, timeout=5)
            print(f"===> SUCCESS! Login works for username: '{user}'")
            ssh.close()
            return user
        except paramiko.AuthenticationException:
            print(f"Authentication failed for: '{user}'")
        except Exception as e:
            print(f"Error for '{user}': {e}")
            
    print("All usernames failed.")
    return None

if __name__ == "__main__":
    try_auth()
