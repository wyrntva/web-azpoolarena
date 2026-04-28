FROM node:20-bookworm AS base

# System deps for Electron + native modules (printer/node-gyp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config \
    libgtk-3-0 libnss3 libxss1 libasound2 libgbm1 libatk-bridge2.0-0 \
    libdrm2 libx11-xcb1 libxcomposite1 libxrandr2 libxdamage1 \
    libxfixes3 libxkbcommon0 libpangocairo-1.0-0 libcups2 \
    libu2f-udev libxshmfence1 libgl1 \
  && rm -rf /var/lib/apt/lists/*

FROM base AS development

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Electron runs as root in container; disable sandbox
ENV ELECTRON_DISABLE_SANDBOX=1

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
