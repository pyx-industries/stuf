# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite)
RUN npm ci

# Copy configuration files
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY components.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY index.html ./

# Copy source code
COPY src/ ./src/

# Copy and set up the entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Use entrypoint with "dev" argument
ENTRYPOINT ["/app/docker-entrypoint.sh", "dev"]

# Build stage (intermediate — not published)
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY components.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY index.html ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# Deploy stage — nginx serving the built assets
FROM nginx:alpine AS production

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-entrypoint.sh /docker-entrypoint.d/10-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/10-runtime-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost || exit 1
