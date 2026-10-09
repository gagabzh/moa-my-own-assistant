#!/bin/bash

# BookStack MCP Server Entrypoint
# This script starts the MCP server with the provided configuration

set -e

echo "=========================================="
echo "BookStack MCP Server Starting..."
echo "=========================================="

# Validate required environment variables
if [ -z "$BOOKSTACK_BASE_URL" ]; then
    echo "ERROR: BOOKSTACK_BASE_URL is not set"
    exit 1
fi

if [ -z "$BOOKSTACK_API_TOKEN" ]; then
    echo "ERROR: BOOKSTACK_API_TOKEN is not set"
    exit 1
fi

# Generate MCP_AUTH_TOKEN if not provided
if [ -z "$MCP_AUTH_TOKEN" ]; then
    export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
    echo "Generated MCP_AUTH_TOKEN: $MCP_AUTH_TOKEN"
fi

# Set default transport to HTTP if not specified
if [ -z "$MCP_TRANSPORT" ]; then
    export MCP_TRANSPORT="http"
fi

# Set default port
if [ -z "$SERVER_PORT" ]; then
    export SERVER_PORT="3000"
fi

echo ""
echo "Configuration:"
echo "  BookStack URL: $BOOKSTACK_BASE_URL"
echo "  Transport Mode: $MCP_TRANSPORT"
echo "  Server Port: $SERVER_PORT"
echo "  MCP Auth Token: ${MCP_AUTH_TOKEN:0:8}..."
echo ""

# Start the MCP server
exec bookstack-mcp-server
