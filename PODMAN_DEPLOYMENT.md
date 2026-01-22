# Podman Deployment Guide

This guide shows how to deploy the gMSA Portal using Podman when docker.io is blocked.

## Prerequisites

- Podman installed
- podman-compose installed (optional, for compose method)

## Method 1: Using Podman Compose (Recommended)

### Install podman-compose (if not installed)
```bash
pip3 install podman-compose
```

### Build and Run
```bash
cd /home/user/git/gmsa
podman-compose -f podman-compose.yml up -d --build
```

### Check Status
```bash
podman-compose -f podman-compose.yml ps
```

### View Logs
```bash
podman-compose -f podman-compose.yml logs -f
```

### Stop
```bash
podman-compose -f podman-compose.yml down
```

## Method 2: Using Podman Directly (No Compose)

### Build the Image
```bash
cd /home/user/git/gmsa
podman build -t gmsa-portal:latest .
```

### Run the Container
```bash
podman run -d \
  --name gmsa-portal \
  -p 3000:3000 \
  -v ./data:/app/data:Z \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart unless-stopped \
  gmsa-portal:latest
```

### Check Status
```bash
podman ps
```

### View Logs
```bash
podman logs -f gmsa-portal
```

### Stop and Remove
```bash
podman stop gmsa-portal
podman rm gmsa-portal
```

## Method 3: Rootless Podman (Most Secure)

Podman can run without root privileges:

### Build
```bash
podman build -t gmsa-portal:latest .
```

### Run
```bash
podman run -d \
  --name gmsa-portal \
  -p 8080:3000 \
  -v ./data:/app/data:Z \
  gmsa-portal:latest
```

Access at: http://localhost:8080

## Alternative Base Images

If `quay.io/nodejs/node:18-alpine` doesn't work, try these alternatives:

### Red Hat UBI (Universal Base Image)
```dockerfile
FROM registry.access.redhat.com/ubi9/nodejs-18:latest
```

### GitHub Container Registry
```dockerfile
FROM ghcr.io/nodejs/node:18-alpine
```

### Custom Registry
If your organization has a mirror, update the Dockerfile:
```dockerfile
FROM your-registry.company.com/node:18-alpine
```

## Troubleshooting

### Issue: Permission Denied on Volume Mount
**Solution**: Use the `:Z` flag for SELinux relabeling:
```bash
-v ./data:/app/data:Z
```

### Issue: Port Already in Use
**Solution**: Change the host port:
```bash
-p 8080:3000  # Maps host 8080 to container 3000
```

### Issue: Cannot Pull Image
**Solution**: Check your registry access and try alternative registries listed above.

### Issue: Storage Issues
**Solution**: Clean up old containers and images:
```bash
podman system prune -a
```

## Systemd Service (Optional)

To run as a system service:

### Create Service File
```bash
sudo vim /etc/systemd/system/gmsa-portal.service
```

```ini
[Unit]
Description=gMSA Portal
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/home/user/git/gmsa
ExecStart=/usr/bin/podman run --rm --name gmsa-portal -p 3000:3000 -v ./data:/app/data:Z gmsa-portal:latest
ExecStop=/usr/bin/podman stop gmsa-portal
Restart=always

[Install]
WantedBy=multi-user.target
```

### Enable and Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable gmsa-portal
sudo systemctl start gmsa-portal
sudo systemctl status gmsa-portal
```

## Access the Application

Once running, access the portal at:
- **Local**: http://localhost:3000
- **Remote**: http://your-server-ip:3000

## Environment Variables

You can customize the deployment:

```bash
podman run -d \
  --name gmsa-portal \
  -p 3000:3000 \
  -v ./data:/app/data:Z \
  -e NODE_ENV=production \
  -e PORT=3000 \
  gmsa-portal:latest
```

Available variables:
- `NODE_ENV`: production or development
- `PORT`: Internal port (default: 3000)
