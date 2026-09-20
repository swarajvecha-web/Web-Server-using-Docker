# Multi-Stage Dockerfile for React Frontend + Nginx Web Server
# -------------------------------------------------------------

# ==========================================
# STAGE 1: Build the React Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm install

# Copy client source files and compile production bundle
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Nginx Web Server Runtime
# ==========================================
FROM nginx:alpine

# Remove default nginx HTML assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled production artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom reverse-proxy and security configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck for Nginx web server
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/nginx-health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
