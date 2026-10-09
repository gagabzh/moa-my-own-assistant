# BookStack - Local Installation

BookStack is a platform for organizing information into books, chapters, and pages. This directory contains the Docker Compose configuration for running BookStack locally.

## Prerequisites

- Docker installed and running
- docker-compose plugin (v2 or later)
- At least 2GB of available RAM

## Quick Start

1. **Navigate to the directory:**
   ```bash
   cd infra/bookstack
   ```

2. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` to customize your configuration (optional):**
   ```bash
   nano .env
   ```

4. **Start the containers:**
   ```bash
   docker compose up -d
   ```

5. **Wait for initialization (approx. 2-5 minutes for first run):**
   ```bash
   docker compose logs -f
   ```

6. **Access BookStack:**
   - Open your browser to: [http://localhost:6875](http://localhost:6875)
   - Complete the setup wizard

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BOOKSTACK_APP_URL` | http://localhost:6875 | Public URL for BookStack |
| `BOOKSTACK_DB_NAME` | bookstack | Database name |
| `BOOKSTACK_DB_USER` | bookstack | Database username |
| `BOOKSTACK_DB_PASSWORD` | bookstack | Database password |
| `BOOKSTACK_ROOT_PASSWORD` | rootpassword | MySQL root password |
| `BOOKSTACK_TIMEZONE` | Europe/Paris | Application timezone |
| `BOOKSTACK_LOCALE` | fr | Application language |

### Ports

- **BookStack**: Port 6875 (mapped to container port 8080)
- **Database**: Internal MySQL/MariaDB on port 3306

## Commands

### Start services
```bash
docker compose up -d
```

### Stop services
```bash
docker compose down
```

### View logs
```bash
docker compose logs -f
```

### Restart services
```bash
docker compose restart
```

### Update BookStack
```bash
docker compose pull
docker compose up -d
```

### Backup database
```bash
docker exec bookstack-db mysqldump -u bookstack -pbookstack bookstack > backup.sql
```

### Restore database
```bash
cat backup.sql | docker exec -i bookstack-db mysql -u bookstack -pbookstack bookstack
```

## Data Persistence

The following data is persisted:
- Database: `/var/lib/docker/volumes/bookstack_bookstack_db_data`
- Uploads: `./data/uploads`
- Storage: `./data/storage`
- Public files: `./data/public`

## Testing

Run the installation test script:
```bash
chmod +x test-installation.sh
./test-installation.sh
```

## Troubleshooting

### Database connection issues
- Ensure the database container is healthy: `docker inspect --format='{{.State.Health.Status}}' bookstack-db`
- Check database logs: `docker logs bookstack-db`
- Verify credentials in `.env` file

### BookStack not starting
- Check BookStack logs: `docker logs bookstack`
- Ensure PHP extensions are installed (the official image includes them)
- Verify storage permissions: `chmod -R 777 ./data`

### Port already in use
- Change the port mapping in `docker-compose.yml` from `6875:8080` to another available port

## Security Notes

- **For production use**: Change all default passwords in `.env`
- **HTTPS**: Configure a reverse proxy (Nginx, Apache) with SSL certificates
- **Backups**: Regularly backup your database and uploads
- **Updates**: Keep BookStack and dependencies updated

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         Docker Host                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   BookStack  │───▶│    MariaDB    │                  │
│  │   Container  │    │   Container   │                  │
│  │   Port 6875 │    │   Port 3306   │                  │
│  └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## Resources

- [BookStack Documentation](https://www.bookstackapp.com/docs)
- [GitHub Repository](https://github.com/BookStackApp/BookStack)
- [Docker Image](https://hub.docker.com/r/lindevs/bookstack)

## Status

- ✅ Configuration files created
- ⏳ Installation not yet tested
- ⏳ Integration with REVIS stack pending
