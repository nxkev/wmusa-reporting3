# CSV Processor

A lightweight full-stack web application for processing large CSV files efficiently. Built with React, Node.js, and SQLite, optimized for DigitalOcean's $6/month Droplet.

## Features

- Upload and process large CSV files (up to 100MB)
- Stream data directly into SQLite for efficient storage
- Query and filter data with pagination
- Clean and transform data using SQL queries
- Export filtered data as CSV
- Modern, responsive UI with Tailwind CSS

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + SQLite
- Deployment: Docker Compose
- Storage: SQLite (ephemeral)

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- 1GB RAM minimum (optimized for DigitalOcean $6 Droplet)

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd csv-processor
   ```

2. Start the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## API Endpoints

### POST /upload
Upload a CSV file (max 100MB)

### POST /query
Execute queries with pagination
```json
{
  "query": "SELECT * FROM data",
  "page": 1,
  "limit": 100
}
```

### POST /update
Update rows based on filter conditions
```json
{
  "filter": { "column": "value" },
  "updates": { "column": "new_value" }
}
```

### GET /download
Download filtered data as CSV

### POST /cleanup
Execute cleanup queries
```json
{
  "query": "UPDATE data SET column = TRIM(column)"
}
```

### GET /schema
Get current data schema

### GET /count
Get row counts (total & filtered)

## Performance Considerations

- Uses streaming for file uploads and downloads
- Implements pagination for large datasets
- SQLite for efficient data storage and querying
- Memory-optimized for 1GB RAM environments
- Rate limiting to prevent overload

## Deployment on DigitalOcean

1. Create a new Droplet (Ubuntu 22.04, 1GB RAM, 1 vCPU)
2. Install Docker and Docker Compose
3. Clone the repository
4. Start the application:
   ```bash
   docker-compose up -d
   ```

## License

MIT 