# Deploy Guide — AZ PoolArena VPS

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

## Cách apps chạy

| App | PM2 name | Port | Cách chạy |
|---|---|---|---|
| NestJS backend | `azpool-api` | 8000 | `npm run start:prod` → `node dist/main` |
| Next.js frontend | `poolarena-nextjs` | 3000 | `next start` |
| PostgreSQL | systemd | 5432 | `postgresql@16-main.service` |
| Mosquitto MQTT | systemd | 1883 | `mosquitto.service` |
| Nginx | systemd | 80/443 | reverse proxy → port 8000 & 3000 |

**PM2 binary:** `/root/.nvm/versions/node/v20.20.2/bin/pm2`  
**Node/npm:** `/root/.nvm/versions/node/v20.20.2/bin/`

---

## Database

```
Host:     localhost:5432
DB:       poolarena
User:     poolarena
Password: ysH63sy6
URL:      postgresql://poolarena:ysH63sy6@localhost:5432/poolarena
```

Xem migrations đã chạy:
```bash
PGPASSWORD=ysH63sy6 psql -U poolarena -d poolarena -h localhost \
  -c 'SELECT name, timestamp FROM migrations ORDER BY timestamp;'
```

---

## Nginx routing

- `https://cms.poolarena.vn` → serve `/www/wwwroot/cms.poolarena.vn/backend/cms/dist/` (React SPA) + proxy `/api/*` → `localhost:8000`
- `https://poolarena.vn` → proxy → `localhost:3000` (Next.js)
- `/uploads/*` trên poolarena.vn → alias `/www/wwwroot/cms.poolarena.vn/backend/uploads/`

Nginx config: `/www/server/panel/vhost/nginx/`

---

## Quy trình deploy đầy đủ

### Bước 0 — Từ máy dev: commit & push

```bash
git add <files>
git commit -m "feat: ..."
git push origin master
```

### Bước 1 — SSH vào server

```bash
ssh root@103.90.225.8
# hoặc qua Python paramiko nếu không có sshpass
```

### Bước 2 — Git pull (2 repo)

```bash
# Repo 1: backend + cms
cd /www/wwwroot/cms.poolarena.vn
git stash && git pull origin master   # git stash nếu có local changes

# Repo 2: Next.js
cd /www/wwwroot/poolarena.vn
git stash && git pull origin master
```

### Bước 3 — Build backend (NestJS)

```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH
cd /www/wwwroot/cms.poolarena.vn/backend

npm install --legacy-peer-deps   # chỉ khi có thay đổi package.json
npm run build
```

### Bước 4 — Chạy migration (nếu có file migration mới)

```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH
cd /www/wwwroot/cms.poolarena.vn/backend
npm run migration:run
```

> **Khi nào cần chạy?** Khi có file mới trong `backend/src/migrations/` so với lần deploy trước.

### Bước 5 — Build CMS frontend (React/Vite)

```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH
cd /www/wwwroot/cms.poolarena.vn/backend/cms

npm install --legacy-peer-deps   # chỉ khi có thay đổi package.json
npm run build
# Output → backend/cms/dist/ (nginx tự serve, không cần restart)
```

### Bước 6 — Build Next.js (poolarena)

```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH
cd /www/wwwroot/poolarena.vn/poolarena

npm install --legacy-peer-deps   # chỉ khi có thay đổi package.json
npm run build
```

### Bước 7 — Restart services qua PM2

```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH

# Restart backend (bắt buộc sau khi build backend)
pm2 restart azpool-api

# Restart Next.js (bắt buộc sau khi build Next.js)
pm2 restart poolarena-nextjs

# Kiểm tra
pm2 list
```

---

## Cheat sheet — deploy nhanh (chỉ code thay đổi, không có migration)

```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH

# Pull
cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master

# Build
cd /www/wwwroot/cms.poolarena.vn/backend && npm run build
cd /www/wwwroot/cms.poolarena.vn/backend/cms && npm run build
cd /www/wwwroot/poolarena.vn/poolarena && npm run build

# Restart
pm2 restart azpool-api poolarena-nextjs && pm2 list
```

---

## Cheat sheet — deploy đầy đủ (có migration)

```bash
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH

cd /www/wwwroot/cms.poolarena.vn && git stash && git pull origin master
cd /www/wwwroot/poolarena.vn && git stash && git pull origin master

cd /www/wwwroot/cms.poolarena.vn/backend && npm run build && npm run migration:run
cd /www/wwwroot/cms.poolarena.vn/backend/cms && npm run build
cd /www/wwwroot/poolarena.vn/poolarena && npm run build

pm2 restart azpool-api poolarena-nextjs && pm2 list
```

---

## Troubleshooting

### PM2 không nhận lệnh
```bash
# Phải export PATH trước khi gọi pm2
export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH
pm2 list
```

### Git pull bị conflict (local changes trên server)
```bash
git stash        # lưu tạm local changes
git pull origin master
# git stash pop  # nếu muốn áp lại — thường KHÔNG cần
```

### Xem log backend
```bash
pm2 logs azpool-api --lines 50
# hoặc
tail -f /root/.pm2/logs/azpool-api-out.log
tail -f /root/.pm2/logs/azpool-api-error.log
```

### Xem log Next.js
```bash
pm2 logs poolarena-nextjs --lines 50
# hoặc
tail -f /root/.pm2/logs/poolarena-nextjs-error.log
```

### Kiểm tra backend có đang chạy không
```bash
ss -tlnp | grep ':8000'
ps aux | grep 'node dist/main'
```

### Mixed Content lỗi (HTTPS gọi HTTP)
Nguyên nhân: `axios.ts` client-side dùng `http://`. Fix đã có trong code:  
khi `window.location.protocol === 'https:'` → dùng `NEXT_PUBLIC_API_URL` (`https://cms.poolarena.vn`).

---

## Các file quan trọng

| File | Mô tả |
|---|---|
| `/www/wwwroot/cms.poolarena.vn/backend/.env` | Env NestJS production (DB, JWT, MQTT...) |
| `/www/wwwroot/poolarena.vn/poolarena/.env` | Env Next.js (`NEXT_PUBLIC_API_URL=https://cms.poolarena.vn`) |
| `/www/server/panel/vhost/nginx/cms.poolarena.vn.conf` | Nginx config CMS |
| `/www/server/panel/vhost/nginx/poolarena.vn.conf` | Nginx config poolarena |
| `/root/.pm2/logs/` | PM2 logs tất cả apps |
