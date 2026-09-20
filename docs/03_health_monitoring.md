# Container Health Monitoring & Troubleshooting

## 1. What is a Docker Healthcheck?
By default, Docker only checks if the main container process (PID 1) is running. However, a web server or backend might be stuck, deadlocked, or returning 500 errors while PID 1 remains active.

A **HEALTHCHECK** instruction instructs Docker to run a command inside the container periodically to verify that the service is genuinely responsive.

### Dockerfile Syntax
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1
```

### Parameters:
- `--interval`: How often the test runs (default: 30s).
- `--timeout`: Maximum time allowed for the test command to complete (default: 30s).
- `--start-period`: Grace period for initialization before failures count toward retries (default: 0s).
- `--retries`: Number of consecutive failures before the container is marked `unhealthy` (default: 3).

### Healthcheck Exit Codes:
- `0`: Success - container is healthy.
- `1`: Unhealthy - container is malfunctioning.
- `2`: Reserved.

---

## 2. Real-Time Resource Monitoring (`docker stats`)
To view real-time CPU, Memory, I/O, and Network utilization of all active containers:
```bash
docker stats
```
Sample Output:
```
CONTAINER ID   NAME                      CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O   PIDS
4a7c85d89a1b   mern-client-1             0.01%     6.42MiB / 7.67GiB     0.08%     1.2kB / 850B      0B / 0B     2
9f182bc312ad   mern-server-1             0.05%     48.2MiB / 7.67GiB     0.61%     2.5kB / 3.1kB     0B / 0B     11
8e21a301bd9c   mern-mongodb-1            0.25%     75.1MiB / 7.67GiB     0.95%     4.1kB / 4.8kB     0B / 0B     32
```
To view stats in a single formatted snapshot:
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

---

## 3. Inspecting Container Health Details (`docker inspect`)
To retrieve specific healthcheck log output and historical failure reasons:
```bash
docker inspect --format='{{json .State.Health}}' mern-server-1
```
Or view the status directly:
```bash
docker inspect --format='{{.State.Health.Status}}' mern-server-1
# Returns: healthy, unhealthy, or starting
```

---

## 4. Common Troubleshooting Scenarios

### Scenario A: Port Already in Use (`bind: address already in use`)
- **Cause**: Another service or container is occupying the requested host port (e.g., port 8080, 5000, or 27017).
- **Diagnosis**:
  ```powershell
  Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
  ```
- **Fix**: Change the host port mapping in `docker-compose.yml` (e.g., `"8081:80"` instead of `"8080:80"`), or stop the competing process.

### Scenario B: Backend cannot connect to MongoDB (`MongooseServerSelectionError`)
- **Cause**: Backend started before MongoDB was ready to accept socket connections, or the hostname is wrong.
- **Fix**:
  1. Ensure MongoDB service has a healthcheck in `docker-compose.yml`.
  2. Use `depends_on` with `condition: service_healthy`:
     ```yaml
     depends_on:
       mongodb:
         condition: service_healthy
     ```
  3. Ensure the connection string uses the service name: `mongodb://mongodb:27017/merndb` (not `localhost`).

### Scenario C: Nginx 502 Bad Gateway
- **Cause**: Nginx web server received a request for `/api/`, but the upstream Node server is either down, unreachable, or listening on the wrong port.
- **Diagnosis**:
  ```bash
  docker compose logs client
  docker compose logs server
  ```
- **Fix**: Confirm the `proxy_pass` directive in `nginx.conf` points to `http://server:5000/api/` and that both containers reside on the same Docker bridge network.

### Scenario D: Container Exits Immediately (Status: `Exited (1)`)
- **Diagnosis**:
  ```bash
  docker logs <container-name>
  ```
- **Common causes**: Missing environment variables, missing start script, syntax error in server code, or missing dependencies.
