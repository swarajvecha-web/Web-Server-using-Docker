# Production Dockerfile for Node.js Express API
# --------------------------------------------------
# 1. Base Image: Alpine Linux with Node 20 (Lightweight & Secure)
FROM node:20-alpine

# 2. Set working directory inside container
WORKDIR /usr/src/app

# 3. Optimize layer caching: copy package manifests first
COPY package*.json ./

# 4. Install production dependencies only
RUN npm install --omit=dev

# 5. Copy the rest of the application code
COPY . .

# 6. Set appropriate file permissions for non-root user
RUN chown -R node:node /usr/src/app

# 7. Principle of Least Privilege: switch to non-root 'node' user
USER node

# 8. Expose application port
EXPOSE 5000

# 9. Define container healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# 10. Start server directly with Node (preserves SIGTERM signal handling)
CMD ["node", "server.js"]
