# WMUSA Reporting Application

A web application for uploading and analyzing store metrics data.

## Features

- CSV file upload for store metrics data
- Dynamic data processing and analysis
- Interactive data visualization
- Database status monitoring
- Cleanup functionality

## Prerequisites

- Docker
- Docker Compose
- Access to a private Docker registry

## Deployment

### 1. Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your configuration:
   - Set `DOCKER_REGISTRY` to your private registry URL
   - Set `TAG` for version control (default: latest)
   - Adjust other variables as needed

### 2. Building Images

Build the Docker images:
```bash
docker compose -f docker-compose.prod.yml build
```

### 3. Pushing to Private Registry

1. Log in to your private registry:
   ```bash
   docker login your-registry.com
   ```

2. Push the images:
   ```bash
   docker compose -f docker-compose.prod.yml push
   ```

### 4. Deployment

1. On your production server, pull the images:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   ```

2. Start the services:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### 5. Verification

1. Check service health:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

2. View logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs
   ```

## Data Persistence

The application uses Docker volumes for data persistence:
- `backend_data`: Stores the SQLite database
- `backend_uploads`: Temporary storage for uploaded files

## Health Monitoring

Both services include health check endpoints:
- Backend: `http://localhost:3001/health`
- Frontend: `http://localhost:3000`

## Maintenance

### Backup

To backup the database:
```bash
docker compose -f docker-compose.prod.yml exec backend tar czf /app/data/backup.tar.gz /app/data/*.db
docker compose -f docker-compose.prod.yml cp backend:/app/data/backup.tar.gz ./backup.tar.gz
```

### Restore

To restore from backup:
```bash
docker compose -f docker-compose.prod.yml cp ./backup.tar.gz backend:/app/data/
docker compose -f docker-compose.prod.yml exec backend tar xzf /app/data/backup.tar.gz -C /
```

## Troubleshooting

1. If services fail to start, check logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs [service_name]
   ```

2. To restart services:
   ```bash
   docker compose -f docker-compose.prod.yml restart [service_name]
   ```

3. To check service health:
   ```bash
   curl http://localhost:3001/health
   ``` 