# =============================================================
# AZ PoolArena Backend — Dockerfile
# Development: chỉ chạy NestJS (CMS dev server chạy riêng)
# Production:  build CMS + NestJS → single image
# =============================================================

# ---- Stage 1: Build CMS (React/Vite) ----
FROM node:20-alpine AS cms-build
WORKDIR /cms

COPY cms/package*.json ./
RUN npm ci --legacy-peer-deps

COPY cms/ .

# VITE_API_URL rỗng → dùng đường dẫn tương đối /api/... (same-origin)
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Stage 2: Build NestJS ----
FROM node:20-alpine AS backend-build
WORKDIR /app

# vips required by sharp
RUN apk add --no-cache vips-dev

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Development (NestJS only, CMS chạy riêng bằng npm run dev:cms) ----
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache vips-dev

COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p uploads/tournaments uploads/avatars
CMD ["npm", "run", "start:dev"]

# ---- Production (NestJS + CMS trong một image) ----
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Ho_Chi_Minh

# vips runtime required by sharp
RUN apk add --no-cache vips

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# NestJS compiled
COPY --from=backend-build /app/dist ./dist

# CMS static files → ServeStaticModule serve từ public/
COPY --from=cms-build /cms/dist ./public

# uploads/ sẽ được mount bởi Docker volume khi runtime
RUN mkdir -p uploads

EXPOSE 8000
CMD ["node", "dist/main"]
