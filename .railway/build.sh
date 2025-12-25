#!/bin/bash

# Install dependencies and build
npm ci
npm run build

# Run migrations
npm run migration:run

echo "Build and migrations completed successfully!"
