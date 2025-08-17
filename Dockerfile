FROM node:20-alpine AS build

WORKDIR /app/pdf-server

# Install system dependencies for Puppeteer & Ghostscript
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ghostscript

# Puppeteer config: skip bundled Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install only production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY ./src ./src

EXPOSE 4001

CMD ["npm", "start"]