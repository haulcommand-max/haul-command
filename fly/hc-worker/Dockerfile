FROM node:20-alpine
WORKDIR /app

# No dependencies required for worker (uses native fetch)

# Copy worker source
COPY . .

# Health check server + queue poller
EXPOSE 8080
CMD ["node", "worker.mjs"]
