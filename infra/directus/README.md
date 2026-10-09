# Directus - Local Installation

This directory contains the Docker Compose configuration for running Directus locally.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your configuration:
   ```bash
   nano .env
   ```

3. **Generate secure keys:**
   ```bash
   # For DIRECTUS_KEY and DIRECTUS_SECRET
   openssl rand -hex 32
   ```

4. **Start the containers:**
   ```bash
   docker compose up -d
   ```

5. **Access Directus:**
   - Admin Interface: http://localhost:8055
   - Email: ${DIRECTUS_ADMIN_EMAIL} (from .env)
   - Password: ${DIRECTUS_ADMIN_PASSWORD} (from .env)

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DIRECTUS_KEY` | Encryption key for sensitive data | Required |
| `DIRECTUS_SECRET` | Secret for sessions and JWT | Required |
| `DIRECTUS_DB_DATABASE` | Database name | directus |
| `DIRECTUS_DB_USER` | Database username | directus |
| `DIRECTUS_DB_PASSWORD` | Database password | Required |
| `DIRECTUS_ADMIN_EMAIL` | Admin user email | admin@example.com |
| `DIRECTUS_ADMIN_PASSWORD` | Admin user password | Required |
| `DIRECTUS_PUBLIC_URL` | Public URL for Directus | http://localhost:8055 |

## Services

- **Directus**: Runs on port 8055
- **PostgreSQL**: Database for Directus data

## Volumes

- `directus_uploads`: Stores uploaded files
- `directus_extensions`: Stores custom extensions
- `directus_data`: PostgreSQL database data

## Management Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f directus

# Update containers
docker compose pull && docker compose up -d

# Reset database (WARNING: deletes all data!)
docker compose down -v
```

## Troubleshooting

### Port already in use
If port 8055 is already in use, change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8056:8055"
```

### Database connection issues
Ensure that:
1. The database credentials in `.env` are correct
2. The PostgreSQL container is running (`docker compose ps`)
3. You're using the correct database host (`directus-db` in the compose network)

## Integration with Other Services

This Directus instance can be integrated with:
- Vikunja (infra/vikunja/)
- BookStack (infra/bookstack/)
- Forgejo (future)

## Data Persistence

All data is persisted in Docker volumes:
- Database data: `directus_data`
- Uploaded files: `directus_uploads`
- Custom extensions: `directus_extensions`

To back up your data:
```bash
# Backup volumes
docker run --rm -v directus_data:/volume -v $(pwd):/backup alpine tar cvf /backup/directus_data_backup.tar /volume
```

## Security Notes

- Always use strong, randomly generated keys and passwords
- Do not commit the `.env` file to version control
- Consider using a reverse proxy (Nginx, Traefik) for production use
- The `.gitignore` file prevents accidental commits of sensitive data
