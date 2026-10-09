# Forgejo - Local Development Instance

Forgejo is a lightweight software forge, a fork of Gitea, providing Git hosting with issue tracking, CI/CD, and more.

## Quick Start

### 1. Copy environment file
```bash
cd infra/forgejo
cp .env.example .env
```

### 2. Edit configuration (optional)
Edit `.env` to customize ports, domain, and other settings.

### 3. Start the container
```bash
# Method 1: Using docker compose directly
docker compose up -d

# Method 2: Using the start script (recommended)
./start.sh
```

### 4. Access Forgejo
- **Web Interface**: http://localhost:3001
- **SSH Access**: `ssh -p 2223 git@localhost`

### 5. Initial Setup
1. First user to register will be the administrator
2. Go to http://localhost:3000/user/sign_up
3. Create your admin account
4. Configure repository settings as needed

## Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Docker configuration |
| `.env.example` | Environment variables template |
| `start.sh` | Startup script |
| `stop.sh` | Shutdown script |

## Ports

- **3001**: HTTP web interface (mapped from container port 3000)
- **2223**: SSH (mapped from container port 22)

## Volumes

All data is persisted in Docker volumes:
- `forgejo_data`: Repository data (/var/lib/forgejo)
- `forgejo_config`: Configuration files (/etc/forgejo)
- `forgejo_ssh`: SSH keys (/root/.ssh)

## Backup

To backup your Forgejo instance:
```bash
# Create backup of volumes
docker run --rm \
  -v forgejo_data:/var/lib/forgejo \
  -v forgejo_config:/etc/forgejo \
  -v forgejo_ssh:/root/.ssh \
  -v $(pwd)/backup:/backup \
  alpine tar cvzf /backup/forgejo-backup-$(date +%Y%m%d-%H%M%S).tar.gz /var/lib/forgejo /etc/forgejo /root/.ssh
```

## Restore

To restore from backup:
```bash
# Stop the container first
./stop.sh

# Restore data
docker run --rm \
  -v forgejo_data:/var/lib/forgejo \
  -v forgejo_config:/etc/forgejo \
  -v forgejo_ssh:/root/.ssh \
  -v $(pwd)/backup:/backup \
  alpine sh -c "rm -rf /var/lib/forgejo/* /etc/forgejo/* /root/.ssh/* && tar xvzf /backup/your-backup-file.tar.gz -C /"

# Start the container
./start.sh
```

## Custom Configuration

### Using MySQL instead of SQLite

1. Uncomment database settings in `.env`
2. Add MySQL service to docker-compose.yml
3. Update Forgejo service environment variables

### Enabling CI/CD Runners

1. Set `FORGEJO_RUNNER_ENABLED=true` in `.env`
2. Configure runner registration token
3. Add runner container to docker-compose.yml

## Security Notes

- Change SSH port from 2222 if it conflicts with other services
- Use strong passwords for admin accounts
- Consider using HTTPS in production
- Regularly backup your data

## Upgrading

To upgrade Forgejo:
```bash
# Stop the container
./stop.sh

# Update the image
docker-compose pull

# Recreate container with new image
./start.sh
```

## Troubleshooting

### Port already in use
- Change the host port in `.env` and docker-compose.yml
- Or stop the service using the conflicting port

### SSH connection issues
- Verify the SSH port (2223 by default)
- Check that the container is running
- Test with: `ssh -v -p 2223 git@localhost`

### Web interface not accessible
- Verify Docker container is running: `docker ps`
- Check logs: `docker logs forgejo`
- Ensure port 3000 is not blocked by firewall

## Useful Commands

```bash
# View logs
docker logs -f forgejo

# Restart container
docker restart forgejo

# Execute command in container
docker exec -it forgejo bash

# Clean up (stops container and removes it)
./stop.sh && docker rm -f forgejo

# Full cleanup (stops, removes container, and removes volumes)
./stop.sh && docker rm -f forgejo && docker volume rm forgejo_data forgejo_config forgejo_ssh
```

## Integration with Other Tools

Forgejo can integrate with:
- **Vikunja**: Webhooks for task management
- **BookStack**: Documentation linking
- **Directus**: Data management

## Resources

- [Forgejo Documentation](https://forgejo.org/docs/)
- [Forgejo GitHub](https://codeberg.org/forgejo/forgejo)
- [Gitea Documentation](https://docs.gitea.io/) (Forgejo is compatible with Gitea docs)
