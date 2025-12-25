FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (plus typeorm for migrations)
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy TypeORM config and migrations for runtime
COPY src/config/typeorm.config.ts ./src/config/
COPY src/database/migrations ./src/database/migrations
COPY tsconfig.json ./

# Install ts-node and typescript for running migrations
RUN npm install --no-save ts-node typescript @types/node tsconfig-paths

# Expose port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Running database migrations..."\n\
npm run migration:run || echo "Migration failed, continuing..."\n\
echo "Starting application..."\n\
node dist/main' > /app/start.sh && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations then application
CMD ["/app/start.sh"]
