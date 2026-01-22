# Using quay.io registry instead of docker.io
FROM quay.io/nodejs/node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy application files
WORKDIR /app
COPY frontend/ ./frontend/
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY data/ ./data/

# Create data directory
RUN mkdir -p /app/data

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "server.js"]
