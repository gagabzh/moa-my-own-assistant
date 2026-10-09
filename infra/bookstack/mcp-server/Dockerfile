# BookStack MCP Server Docker Image
# Based on alpine with Bun installed

FROM alpine:3.18

# Install dependencies
RUN apk add --no-cache \
    curl \
    git \
    unzip \
    openssl \
    bash \
    g++ \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Install Bun
ENV BUN_INSTALL="/home/nodejs/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"
RUN mkdir -p /home/nodejs/.bun && \
    curl -fsSL https://bun.sh/install | BUN_INSTALL=/home/nodejs/.bun bash

# Install bookstack-mcp-server globally
RUN bun add -g pnocera/bookstack-mcp-server

# Set non-root user
RUN addgroup -g 1000 -S nodejs && \
    adduser -S nodejs -u 1000 -G nodejs

# Create app directory and copy files as root first
RUN mkdir -p /app
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    chown nodejs:nodejs /app/entrypoint.sh

# Switch to non-root user
USER nodejs
WORKDIR /app

# Ensure PATH is available
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Expose MCP server port
EXPOSE 3000

# Start the server
ENTRYPOINT ["/app/entrypoint.sh"]
