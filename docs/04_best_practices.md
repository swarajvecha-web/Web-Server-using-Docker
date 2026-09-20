# Container-Based App Deployment Best Practices

## 1. Multi-Stage Docker Builds
Single-stage builds bundle all development dependencies, source compilers, and SDKs into the final production image, resulting in image bloat (often 1GB+) and a large attack surface.

**Multi-Stage builds** solve this by using separate temporary stages:
- **Stage 1 (Builder)**: Installs dependencies, runs unit tests, and compiles the bundle (`npm run build`).
- **Stage 2 (Production Runtime)**: Uses a minimal, hardened base image (e.g., `nginx:alpine` or `node:alpine`) and copies *only* the compiled assets or production dependencies from Stage 1.

**Result**:
- React image reduced from ~800MB to ~25MB!
- Zero development dependencies or sensitive source code in the final production container.

---

## 2. Principle of Least Privilege (Non-Root User)
By default, Docker containers run commands as the `root` user (`uid: 0`). If an attacker escapes a compromised container, they could gain root privileges on the host OS.

**Best Practice**:
- In Node images, switch to the built-in non-root user:
  ```dockerfile
  USER node
  ```
- In Nginx, use `nginxinc/nginx-unprivileged:alpine` or configure permissions for user `nginx`.

---

## 3. Leverage Docker Build Layer Caching
Docker builds images in layers. Each command in a Dockerfile represents a layer. If the files in a layer haven't changed, Docker reuses the cached layer.

**Anti-Pattern**:
```dockerfile
COPY . .
RUN npm install
```
*Problem*: Any small change to a README or CSS file invalidates the cache for `RUN npm install`, forcing npm to re-download all packages every single build.

**Best Practice**:
```dockerfile
# Copy package files first:
COPY package*.json ./
# Run install: this layer will be cached unless dependencies change!
RUN npm ci --only=production
# Then copy the rest of the application code:
COPY . .
```

---

## 4. Comprehensive `.dockerignore`
Just like `.gitignore` keeps clutter out of Git, `.dockerignore` prevents unwanted files from being sent to the Docker daemon build context:
- `node_modules` (must be built natively inside the Linux container, not copied from Windows/Mac)
- `.git` (prevents exposing git history and repository metadata)
- `.env` (prevents baking private keys or database passwords into image layers)
- Temporary build outputs (`dist/`, `build/`, `*.log`)

---

## 5. Clean Environment Variable Management
- Never hardcode sensitive secrets or database credentials into Dockerfiles or source code.
- Use an environment variable file (`.env`) for local orchestrations.
- Provide a `.env.example` file checked into Git documenting required variables without actual secrets.
- Use Docker Compose `environment` and `env_file` blocks to inject configuration dynamically at runtime.

---

## 6. Proper Process Handling & Signal Forwarding
- In Node.js, ensure your server listens to `SIGTERM` and `SIGINT` signals so that when `docker stop` is executed, existing HTTP connections finish processing gracefully before the database connection closes.
- Avoid wrapping Node scripts in unnecessary shell wrappers that swallow POSIX signals.
