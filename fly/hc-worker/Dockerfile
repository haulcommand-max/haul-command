FROM node:20-alpine
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --production 2>/dev/null || npm install --production

# Copy worker source
COPY . .

# Health check server + queue poller
EXPOSE 8080
CMD ["node", "worker.mjs"]
