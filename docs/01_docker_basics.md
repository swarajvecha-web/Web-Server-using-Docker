# Docker Containerization Basics

## 1. What is Docker?
Docker is an open-source platform that enables developers to build, package, ship, and run applications in lightweight, isolated environments called **containers**.

Unlike traditional Virtual Machines (VMs), which virtualize the physical hardware and run a complete guest OS on top of a hypervisor, containers share the host operating system kernel. This makes them:
- **Instant to start** (milliseconds vs minutes for VMs)
- **Extremely lightweight** (megabytes vs gigabytes)
- **Portable and reproducible** ("it works on my machine" becomes "it works everywhere")

---

## 2. Core Docker Concepts

### A. Docker Image vs Docker Container
| Concept | Description | Analogy |
| :--- | :--- | :--- |
| **Docker Image** | A read-only, immutable template with layers containing the OS libraries, source code, runtime, and configuration. | A blueprint or a class |
| **Docker Container** | A runnable, isolated instance of a Docker Image with a thin writable layer on top. | An instantiated object or building |

### B. The Dockerfile
A text file with instructions on how Docker should build an image layer by layer:
- `FROM`: Specifies the base image (e.g., `node:20-alpine`, `nginx:alpine`, `mongo:6`).
- `WORKDIR`: Sets the working directory inside the container.
- `COPY`: Copies files from your local machine to the container image.
- `RUN`: Executes shell commands during the build phase (e.g., `npm install`).
- `EXPOSE`: Informs Docker which ports the container listens on at runtime.
- `ENV`: Defines environment variables.
- `USER`: Sets the UID/user to run the application securely (avoiding root).
- `CMD` / `ENTRYPOINT`: Specifies the default command executed when the container starts.

### C. Docker Ports (Port Mapping)
Containers run in isolated network namespaces. To access a container from your host machine (browser, curl, Postman), you must map host ports to container ports:
```bash
docker run -p <HOST_PORT>:<CONTAINER_PORT> <IMAGE_NAME>
# Example:
docker run -p 8080:80 nginx:alpine
```
Here, incoming traffic on host port `8080` is forwarded to port `80` inside the Nginx container.

### D. Docker Volumes (Data Persistence)
Container filesystems are ephemeral: any data written to a container is lost when the container is deleted. **Volumes** map directory storage from the host or Docker storage area into the container to persist data across container restarts and updates:
- **Named Volume**: Managed by Docker (`docker volume create mongo_data`). Used for databases like MongoDB.
- **Bind Mount**: Directly mounts a host folder (`./src:/app/src`) into the container. Used during local development for hot-reloading.

### E. Docker Networks
Docker provides built-in networking drivers:
- **Bridge network (default)**: Containers on the same user-defined bridge network can communicate with each other using their service/container names as DNS hostnames (e.g., `server` connects to `mongodb:27017`).
- **Host network**: Container shares the host network namespace directly.
- **None**: Disables all networking for the container.

---

## 3. Architecture in Our MERN Web Server Setup
In this project:
1. **Nginx Web Server Container (`client`)**: Exposed on port `8080`. Serves compiled React assets and proxies `/api/*` to `server:5000`.
2. **Node/Express API Container (`server`)**: Listens on port `5000` inside the internal Docker bridge network.
3. **Database Container (`mongodb`)**: Listens on port `27017` inside the internal Docker network. Persistent data is stored in `mongo_data` volume.
