FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY message-service/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy shared-lib first
COPY shared-lib/ ./shared-lib/

# Copy source code
COPY message-service/ .

# Expose port
EXPOSE 3003

# Start the application
CMD ["node", "server.js"]