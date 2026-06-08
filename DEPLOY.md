# Deploy Guide — AZ PoolArena VPS

## CI/CD tự động (GitHub Actions)

Mỗi khi push lên `master` → GitHub Actions tự SSH vào server, build image, restart containers.

### Setup một lần (GitHub Secrets)

**Bước 1 — Tạo SSH key trên server:**
```bash
ssh root@103.90.225.8
ssh-keygen -t ed25519 -C "github-actions@azpoolarena" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions   # copy toàn bộ nội dung này
```

**Bước 2 — Thêm Secrets vào GitHub:**

Vào repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Giá trị |
|---|---|
| `SERVER_HOST` | `103.90.225.8` |
| `SERVER_USER` | `root` |
| `SERVER_SSH_KEY` | Nội dung file `~/.ssh/github_actions` (private key, bắt đầu bằng `-----BEGIN`) |

**Bước 3 — Tạo GitHub Environment (tùy chọn, thêm bảo vệ):**

Vào repo → **Settings → Environments → New environment** → đặt tên `production`.

Sau khi setup, mỗi `git push origin master` sẽ tự deploy. Xem kết quả tại tab **Actions** trên GitHub.

---

## Thông tin server

| | |
|---|---|
| IP | `103.90.225.8` |
| User | `root` |
| Password | `hJHCQ8h1j0WjoctKwfpU` |
| Panel | BT Panel (宝塔) |
| SSH | `ssh root@103.90.225.8` |

---

## Cấu trúc trên VPS

```
/www/wwwroot/
├── cms.poolarena.vn/          ← Git repo gốc (backend + cms + scoreboard + ...)
│   └── backend/
│       ├── dist/              ← NestJS build output (node dist/main)
│       ├── cms/dist/          ← React/Vite CMS build output (served by nginx)
│       ├── uploads/           ← File uploads (ảnh, avatar...)
│       ├── .env               ← Production env của NestJS
│       └── src/migrations/    ← TypeORM migration files
│
└── poolarena.vn/              ← Git repo riêng (clone cùng repo)
    └── poolarena/             ← Next.js app (subfolder trong repo)
        └── .env               ← NEXT_PUBLIC_API_URL=https://cms.poolarena.vn
```

---

## Cách apps chạy (Docker — hiện tại)

| App | Container | Port | Image |
|---|---|---|---|
| NestJS backend + CMS | `azpool-backend-prod` | 127.0.0.1:8000 | `azpool-backend:prod` |
| Next.js frontend | `azpool-poolarena-prod` | 127.0.0.1:3000 | `azpool-poolarena:prod` |
| PostgreSQL 16 | `azpool-db-prod` | internal only | `postgres:16-alpine` |
| Mosquitto MQTT | `azpool-mqtt-prod` | internal only | `eclipse-mosquitto:2` |
| Nginx | BT Panel (systemd) | 80/443 | reverse proxy → :8000 & :3000 |

```bash
# Xem trạng thái
docker compose -f /www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml ps

# Xem log
docker logs azpool-backend-prod --tail 50
docker logs azpool-poolarena-prod --tail 50
```

> PM2 `azpool-api` và `poolarena-nextjs` đã **stopped** — chỉ dùng làm fallback khi cần.

**PM2 binary (fallback):** `/root/.nvm/versions/node/v20.20.2/bin/pm2`

---

## Database

```
Host (Docker internal):  db:5432
DB:       poolarena
User:     poolarena
Password: (xem /www/wwwroot/cms.poolarena.vn/.env → POSTGRES_PASSWORD)
```

```bash
# Kết nối vào Docker PostgreSQL
docker exec -it azpool-db-prod psql -U poolarena -d poolarena

# Xem migrations đã chạy
docker exec -it azpool-db-prod psql -U poolarena -d poolarena \
  -c 'SELECT name, timestamp FROM migrations ORDER BY timestamp;'

# Backup
docker exec azpool-db-prod pg_dump -U poolarena poolarena -F c > /tmp/backup_$(date +%Y%m%d).dump

# Restore từ backup
docker exec -i azpool-db-prod pg_restore --no-owner -U poolarena -d poolarena < /tmp/backup.dump
```

---

## Nginx routing

- `https://cms.poolarena.vn` → serve `/www/wwwroot/cms.poolarena.vn/backend/cms/dist/` (React SPA) + proxy `/api/*` → `localhost:8000`
- `https://poolarena.vn` → proxy → `localhost:3000` (Next.js)
- `/uploads/*` trên poolarena.vn → alias `/www/wwwroot/cms.poolarena.vn/backend/uploads/`

Nginx config: `/www/server/panel/vhost/nginx/`

---

## Quy trình deploy Docker (hiện tại)

### Bước 0 — Từ máy dev: commit & push

```bash
git add <files>
git commit -m "feat: ..."
git push origin master
```

### Bước 1 — SSH vào server

```bash
ssh root@103.90.225.8
```

### Bước 2 — Git pull (2 repo)

```bash
cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master
```

### Bước 3 — Chạy migration (nếu có file migration mới)

```bash
# Chạy migration trong container backend đang chạy
docker exec azpool-backend-prod node dist/main --migration
# HOẶC nếu migration script riêng:
docker exec -w /app azpool-backend-prod npx typeorm migration:run -d dist/data-source.js
```

> Khi nào cần? Khi có file mới trong `backend/src/migrations/`.

### Bước 4 — Rebuild và restart Docker services

```bash
cd /www/wwwroot/cms.poolarena.vn

# Build lại image (chỉ service nào thay đổi)
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build poolarena

# Restart
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

---

## Cheat sheet — deploy nhanh (Docker)

```bash
# Pull
cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master

# Rebuild và restart
cd /www/wwwroot/cms.poolarena.vn
docker compose -f docker-compose.prod.yml build backend poolarena
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

---

## Cheat sheet — deploy đầy đủ (có migration, Docker)

```bash
cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master

cd /www/wwwroot/cms.poolarena.vn
docker compose -f docker-compose.prod.yml build backend poolarena
docker compose -f docker-compose.prod.yml up -d

# Chạy migration
docker exec azpool-backend-prod npx typeorm migration:run -d dist/data-source.js

docker compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### Xem log containers
```bash
docker logs azpool-backend-prod --tail 50 -f
docker logs azpool-poolarena-prod --tail 50 -f
docker logs azpool-db-prod --tail 20
docker logs azpool-mqtt-prod --tail 20
```

### Restart một container
```bash
cd /www/wwwroot/cms.poolarena.vn
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart poolarena
```

### Container bị lỗi / không khởi động
```bash
# Xem lỗi
docker compose -f docker-compose.prod.yml ps
docker inspect azpool-backend-prod | grep -A5 State

# Rebuild không cache nếu build lỗi
docker compose -f docker-compose.prod.yml build --no-cache backend
```

### Git pull bị conflict (local changes trên server)
```bash
git stash
git pull origin master
```

### Fallback về PM2 (khẩn cấp)
```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH
# Stop Docker
docker compose -f /www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml stop backend poolarena
# Start PM2
pm2 start azpool-api
pm2 start poolarena-nextjs
pm2 list
```

### Kiểm tra port
```bash
ss -tlnp | grep -E ':8000|:3000|:1883'
```

### Mixed Content lỗi (HTTPS gọi HTTP)
Nguyên nhân: `axios.ts` client-side dùng `http://`. Fix đã có trong code:  
khi `window.location.protocol === 'https:'` → dùng `NEXT_PUBLIC_API_URL` (`https://cms.poolarena.vn`).

---

## Các file quan trọng

| File | Mô tả |
|---|---|
| `/www/wwwroot/cms.poolarena.vn/backend/.env` | Env NestJS production (DB, JWT, MQTT, OpenAI...) |
| `/www/wwwroot/cms.poolarena.vn/.env` | Root env Docker Compose (POSTGRES_DB/USER/PASSWORD, NEXT_PUBLIC_API_URL) |
| `/www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml` | Docker Compose production config |
| `/www/wwwroot/cms.poolarena.vn/mosquitto/config/mosquitto.conf` | Cấu hình MQTT broker |
| `/www/wwwroot/cms.poolarena.vn/backend/uploads/` | File uploads (mounted vào container) |
| `/www/server/panel/vhost/nginx/cms.poolarena.vn.conf` | BT Panel nginx config CMS |
| `/www/server/panel/vhost/nginx/poolarena.vn.conf` | BT Panel nginx config poolarena |
| `/www/server/panel/vhost/cert/cms.poolarena.vn/` | SSL cert CMS |
| `/www/server/panel/vhost/cert/poolarena.vn/` | SSL cert poolarena |

## Cấu trúc trên VPS (Docker)

```
/www/wwwroot/
├── cms.poolarena.vn/          ← Repo chính (backend + docker-compose)
│   ├── .env                   ← Root env cho docker-compose.prod.yml
│   ├── docker-compose.prod.yml
│   ├── backend/
│   │   ├── .env               ← NestJS production env
│   │   └── uploads/           ← File uploads (volume mount)
│   └── mosquitto/config/      ← MQTT config
│
└── poolarena.vn/              ← Repo clone riêng (Next.js source)
    └── poolarena/             ← Next.js app source
```
