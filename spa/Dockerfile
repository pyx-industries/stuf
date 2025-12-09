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

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy configuration files needed for build
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY components.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY index.html ./

# Copy source code
COPY src/ ./src/

# Install dev dependencies needed for build
RUN npm install vite @vitejs/plugin-react --save-dev

# Build the application
RUN npm run build

# Copy and set up the entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Use entrypoint with "prod" argument (default)
ENTRYPOINT ["/app/docker-entrypoint.sh", "prod"]
