FROM node:20-slim

# Install build dependencies for SQLite
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild sqlite3
RUN npm ci && \
    npm rebuild sqlite3 --build-from-source

# Copy the rest of the application
COPY . .

# Create necessary directories
RUN mkdir -p data uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 