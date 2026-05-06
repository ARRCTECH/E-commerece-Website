# Multi-stage build for React app
FROM node:20-alpine as build-stage

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with minimal memory footprint
RUN npm ci --production=false --no-audit --no-fund --legacy-peer-deps

# Copy source code
COPY . .

# Set Node.js memory options and build the app with optimized config
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build:docker

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration (use simple http config)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
