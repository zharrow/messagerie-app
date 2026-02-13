FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY auth-service/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy shared-lib first
COPY shared-lib/ ./shared-lib/

# Copy source code
COPY auth-service/ .

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "server.js"]