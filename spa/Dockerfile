# Development stage
FROM node:20-alpine as development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite)
RUN npm install

# Copy configuration files
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY components.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY index.html ./

# Copy source code
COPY src/ ./src/

EXPOSE 3000

# Use Vite dev server for development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production stage
FROM node:20-alpine as production

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

# Use Vite preview server for production
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
