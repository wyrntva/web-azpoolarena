# Base stage
FROM node:20-alpine AS base

# Development stage
FROM base AS development

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install --legacy-peer-deps

# Copy toàn bộ source code vào container
COPY . .

# Expose port (Vite mặc định dùng 5173)
EXPOSE 5173

# Lệnh khởi chạy server dev
CMD ["npm", "run", "dev", "--", "--host"]

# Production build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
