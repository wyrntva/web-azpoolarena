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
├── poolarena.vn/              ← Git repo riêng (clone cùng repo)
│   └── poolarena/             ← Next.js app (subfolder trong repo)
│       └── .env               ← NEXT_PUBLIC_API_URL=https://cms.poolarena.vn
│
├── dev.cms.poolarena.vn/      ← Git repo dev (clone cùng repo, DB riêng)
│   └── backend/
│       ├── .env               ← Dev env (DB: poolarena_dev, ENV: development)
│       └── uploads/           ← File uploads dev
│
└── dev.poolarena.vn/          ← Git repo dev poolarena (clone cùng repo)
    └── poolarena/             ← Next.js app source
```

---

## Cách apps chạy (Docker — hiện tại)

### Production

| App | Container | Port | Image |
|---|---|---|---|
| NestJS backend + CMS | `azpool-backend-prod` | 127.0.0.1:8000 | `azpool-backend:prod` |
| Next.js frontend | `azpool-poolarena-prod` | 127.0.0.1:3000 | `azpool-poolarena:prod` |
| PostgreSQL 16 | `azpool-db-prod` | internal only | `postgres:16-alpine` |
| Mosquitto MQTT | `azpool-mqtt-prod` | internal only | `eclipse-mosquitto:2` |
| Nginx | BT Panel (systemd) | 80/443 | reverse proxy → :8000 & :3000 |

### Dev

| App | Container | Port | Image |
|---|---|---|---|
| NestJS backend + CMS | `azpool-backend-dev` | 127.0.0.1:8001 | `azpool-backend:dev` |
| Next.js frontend | `azpool-poolarena-dev` | 127.0.0.1:3001 | `azpool-poolarena:dev` |
| PostgreSQL 16 | `azpool-db-dev` | internal only | `postgres:16-alpine` |
| Mosquitto MQTT | `azpool-mqtt-dev` | internal only | `eclipse-mosquitto:2` |
| Nginx | BT Panel (systemd) | 80/443 | reverse proxy → :8001 & :3001 |

```bash
# Xem trạng thái
docker compose -f /www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml ps
docker compose -f /www/wwwroot/dev.cms.poolarena.vn/docker-compose.dev.yml ps

# Xem log prod
docker logs azpool-backend-prod --tail 50
docker logs azpool-poolarena-prod --tail 50

# Xem log dev
docker logs azpool-backend-dev --tail 50
docker logs azpool-poolarena-dev --tail 50
```

> PM2 `azpool-api` và `poolarena-nextjs` đã **stopped** — chỉ dùng làm fallback khi cần.

**PM2 binary (fallback):** `/root/.nvm/versions/node/v20.20.2/bin/pm2`

---

## Database

### Production
```
Host (Docker internal):  db:5432
DB:       poolarena
User:     poolarena
Password: (xem /www/wwwroot/cms.poolarena.vn/.env → POSTGRES_PASSWORD)
```

### Dev (DB riêng, không ảnh hưởng prod)
```
Host (Docker internal):  db:5432
DB:       poolarena_dev
User:     poolarena
Password: (xem /www/wwwroot/dev.cms.poolarena.vn/.env → POSTGRES_PASSWORD)
```

```bash
# Kết nối vào Docker PostgreSQL (prod)
docker exec -it azpool-db-prod psql -U poolarena -d poolarena

# Kết nối vào Docker PostgreSQL (dev)
docker exec -it azpool-db-dev psql -U poolarena -d poolarena_dev

# Xem migrations đã chạy (prod)
docker exec -it azpool-db-prod psql -U poolarena -d poolarena \
  -c 'SELECT name, timestamp FROM migrations ORDER BY timestamp;'

# Backup (prod)
docker exec azpool-db-prod pg_dump -U poolarena poolarena -F c > /tmp/backup_$(date +%Y%m%d).dump

# Restore từ backup (prod)
docker exec -i azpool-db-prod pg_restore --no-owner -U poolarena -d poolarena < /tmp/backup.dump

# Clone DB prod sang dev (để test với data thực)
docker exec azpool-db-prod pg_dump -U poolarena poolarena -F c > /tmp/prod_to_dev.dump
docker exec -i azpool-db-dev pg_restore --no-owner -U poolarena -d poolarena_dev --clean < /tmp/prod_to_dev.dump
```

---

## Nginx routing

### Production
- `https://cms.poolarena.vn` → serve `/www/wwwroot/cms.poolarena.vn/backend/cms/dist/` + proxy `/api/*` → `localhost:8000`
- `https://poolarena.vn` → proxy → `localhost:3000` (Next.js)
- `/uploads/*` trên poolarena.vn → alias `/www/wwwroot/cms.poolarena.vn/backend/uploads/`

### Dev
- `https://dev.cms.poolarena.vn` → serve `/www/wwwroot/dev.cms.poolarena.vn/backend/cms/dist/` + proxy `/api/*` → `localhost:8001`
- `https://dev.poolarena.vn` → proxy → `localhost:3001` (Next.js)
- `/uploads/*` trên dev.poolarena.vn → alias `/www/wwwroot/dev.cms.poolarena.vn/backend/uploads/`

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

### Bước 2 — Git pull (4 repo: prod + dev)

```bash
# Production
cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master

# Dev
cd /www/wwwroot/dev.cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/dev.poolarena.vn && git stash && git pull origin master
```

### Bước 3 — Chạy migration (nếu có file migration mới)

```bash
# Production
docker exec -w /app azpool-backend-prod npx typeorm migration:run -d dist/data-source.js

# Dev
docker exec -w /app azpool-backend-dev npx typeorm migration:run -d dist/data-source.js
```

> Khi nào cần? Khi có file mới trong `backend/src/migrations/`.

### Bước 4 — Rebuild và restart Docker services

```bash
# Production
cd /www/wwwroot/cms.poolarena.vn
docker compose -f docker-compose.prod.yml build --no-cache backend poolarena
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps

# Dev
cd /www/wwwroot/dev.cms.poolarena.vn
docker compose -f docker-compose.dev.yml build --no-cache backend poolarena
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

---

## Cheat sheet — deploy nhanh (Docker)

```bash
# 1. Pull code mới (prod + dev)
cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/dev.cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/dev.poolarena.vn && git stash && git pull origin master

# 2. Rebuild và restart PRODUCTION
# (dùng --no-cache để đảm bảo CMS frontend luôn được build lại)
cd /www/wwwroot/cms.poolarena.vn
docker compose -f docker-compose.prod.yml build --no-cache backend poolarena
docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d

# 3. Đồng bộ CMS build sang host — PRODUCTION
docker cp azpool-backend-prod:/app/public/. /www/wwwroot/cms.poolarena.vn/backend/cms/dist/

# 4. Rebuild và restart DEV
cd /www/wwwroot/dev.cms.poolarena.vn
docker compose -f docker-compose.dev.yml build --no-cache backend poolarena
docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.dev.yml up -d

# 5. Đồng bộ CMS build sang host — DEV
docker cp azpool-backend-dev:/app/public/. /www/wwwroot/dev.cms.poolarena.vn/backend/cms/dist/

# 6. Kiểm tra trạng thái
docker compose -f /www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml ps
docker compose -f /www/wwwroot/dev.cms.poolarena.vn/docker-compose.dev.yml ps
```

---

## Cheat sheet — deploy đầy đủ (có migration, Docker)

```bash
# 1. Pull code mới (prod + dev)
cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/dev.cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/dev.poolarena.vn && git stash && git pull origin master

# 2. Rebuild và restart PRODUCTION
cd /www/wwwroot/cms.poolarena.vn
docker compose -f docker-compose.prod.yml build --no-cache backend poolarena
docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d

# 3. Chạy migration — PRODUCTION
docker exec azpool-backend-prod npx typeorm migration:run -d dist/data-source.js

# 4. Đồng bộ CMS build sang host — PRODUCTION
docker cp azpool-backend-prod:/app/public/. /www/wwwroot/cms.poolarena.vn/backend/cms/dist/

# 5. Rebuild và restart DEV
cd /www/wwwroot/dev.cms.poolarena.vn
docker compose -f docker-compose.dev.yml build --no-cache backend poolarena
docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.dev.yml up -d

# 6. Chạy migration — DEV
docker exec azpool-backend-dev npx typeorm migration:run -d dist/data-source.js

# 7. Đồng bộ CMS build sang host — DEV
docker cp azpool-backend-dev:/app/public/. /www/wwwroot/dev.cms.poolarena.vn/backend/cms/dist/

# 8. Kiểm tra trạng thái
docker compose -f /www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml ps
docker compose -f /www/wwwroot/dev.cms.poolarena.vn/docker-compose.dev.yml ps
```

---

## Troubleshooting

### Xem log containers
```bash
# Production
docker logs azpool-backend-prod --tail 50 -f
docker logs azpool-poolarena-prod --tail 50 -f
docker logs azpool-db-prod --tail 20
docker logs azpool-mqtt-prod --tail 20

# Dev
docker logs azpool-backend-dev --tail 50 -f
docker logs azpool-poolarena-dev --tail 50 -f
docker logs azpool-db-dev --tail 20
docker logs azpool-mqtt-dev --tail 20
```

### Restart một container
```bash
# Production
cd /www/wwwroot/cms.poolarena.vn
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart poolarena

# Dev
cd /www/wwwroot/dev.cms.poolarena.vn
docker compose -f docker-compose.dev.yml restart backend
docker compose -f docker-compose.dev.yml restart poolarena
```

### Container bị lỗi / không khởi động
```bash
# Xem lỗi (prod)
docker compose -f /www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml ps
docker inspect azpool-backend-prod | grep -A5 State
docker compose -f /www/wwwroot/cms.poolarena.vn/docker-compose.prod.yml build --no-cache backend

# Xem lỗi (dev)
docker compose -f /www/wwwroot/dev.cms.poolarena.vn/docker-compose.dev.yml ps
docker inspect azpool-backend-dev | grep -A5 State
docker compose -f /www/wwwroot/dev.cms.poolarena.vn/docker-compose.dev.yml build --no-cache backend
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

### Production
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

### Dev
| File | Mô tả |
|---|---|
| `/www/wwwroot/dev.cms.poolarena.vn/backend/.env` | Env NestJS dev (DB: poolarena_dev, ENV: development) |
| `/www/wwwroot/dev.cms.poolarena.vn/.env` | Root env Docker Compose dev (POSTGRES_DB=poolarena_dev, NEXT_PUBLIC_API_URL=https://dev.cms.poolarena.vn) |
| `/www/wwwroot/dev.cms.poolarena.vn/docker-compose.dev.yml` | Docker Compose dev config |
| `/www/wwwroot/dev.cms.poolarena.vn/backend/uploads/` | File uploads dev (mounted vào container) |
| `/www/server/panel/vhost/nginx/dev.cms.poolarena.vn.conf` | BT Panel nginx config CMS dev |
| `/www/server/panel/vhost/nginx/dev.poolarena.vn.conf` | BT Panel nginx config poolarena dev |
| `/www/server/panel/vhost/cert/dev.cms.poolarena.vn/` | SSL cert CMS dev |
| `/www/server/panel/vhost/cert/dev.poolarena.vn/` | SSL cert poolarena dev |

---

## Setup dev environment (một lần)

### Bước 1 — Clone repo lên server

```bash
ssh root@103.90.225.8

# Clone repo cho dev backend/cms
cd /www/wwwroot
git clone https://github.com/<YOUR_REPO> dev.cms.poolarena.vn
# HOẶC nếu đã có SSH key:
# git clone git@github.com:<YOUR_REPO>.git dev.cms.poolarena.vn

# Clone repo cho dev poolarena
git clone https://github.com/<YOUR_REPO> dev.poolarena.vn
```

### Bước 2 — Tạo file .env cho dev

```bash
# Root .env (Docker Compose)
cat > /www/wwwroot/dev.cms.poolarena.vn/.env << 'EOF'
POSTGRES_DB=poolarena_dev
POSTGRES_USER=poolarena
POSTGRES_PASSWORD=<SAME_OR_DIFFERENT_PASSWORD>
NEXT_PUBLIC_API_URL=https://dev.cms.poolarena.vn
POOLARENA_CONTEXT=/www/wwwroot/dev.poolarena.vn/poolarena
EOF

# Backend .env (copy từ prod rồi sửa DB name)
cp /www/wwwroot/cms.poolarena.vn/backend/.env /www/wwwroot/dev.cms.poolarena.vn/backend/.env
# Sửa: DATABASE_URL=postgresql://poolarena:<PASS>@localhost:5432/poolarena_dev
# Sửa: ENV=development (nếu cần)
nano /www/wwwroot/dev.cms.poolarena.vn/backend/.env
```

### Bước 3 — Tạo thư mục uploads

```bash
mkdir -p /www/wwwroot/dev.cms.poolarena.vn/backend/uploads
```

### Bước 4 — Khởi động dev containers lần đầu

```bash
cd /www/wwwroot/dev.cms.poolarena.vn
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

### Bước 5 — Chạy migration cho DB dev

```bash
docker exec azpool-backend-dev npx typeorm migration:run -d dist/data-source.js
```

### Bước 6 — Đồng bộ CMS build sang host

```bash
docker cp azpool-backend-dev:/app/public/. /www/wwwroot/dev.cms.poolarena.vn/backend/cms/dist/
```

### Bước 7 — Cấu hình Nginx trong BT Panel

Tạo 2 website mới trong BT Panel:
- `dev.cms.poolarena.vn` → port 8001 (proxy API) + serve `cms/dist/` static
- `dev.poolarena.vn` → port 3001 (proxy Next.js)

Tham khảo config nginx tại `/www/server/panel/vhost/nginx/cms.poolarena.vn.conf` và điều chỉnh port/path cho dev.

---

## Cấu trúc trên VPS (Docker)

```
/www/wwwroot/
├── cms.poolarena.vn/          ← Repo chính (backend + docker-compose.prod.yml)
│   ├── .env                   ← Root env (POSTGRES_DB=poolarena, NEXT_PUBLIC_API_URL=https://cms.poolarena.vn)
│   ├── docker-compose.prod.yml
│   ├── backend/
│   │   ├── .env               ← NestJS production env
│   │   └── uploads/           ← File uploads (volume mount)
│   └── mosquitto/config/      ← MQTT config
│
├── poolarena.vn/              ← Repo clone riêng (Next.js source — prod)
│   └── poolarena/             ← Next.js app source
│
├── dev.cms.poolarena.vn/      ← Repo clone dev (backend + docker-compose.dev.yml)
│   ├── .env                   ← Root env (POSTGRES_DB=poolarena_dev, NEXT_PUBLIC_API_URL=https://dev.cms.poolarena.vn)
│   ├── docker-compose.dev.yml ← Dev compose (ports 8001/3001, containers azpool-*-dev)
│   ├── backend/
│   │   ├── .env               ← NestJS dev env (DATABASE_URL trỏ vào poolarena_dev)
│   │   └── uploads/           ← File uploads dev
│   └── mosquitto/config/      ← MQTT config (symlink hoặc copy từ prod)
│
└── dev.poolarena.vn/          ← Repo clone dev (Next.js source — dev)
    └── poolarena/             ← Next.js app source
```
