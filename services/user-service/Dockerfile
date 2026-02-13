FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Copy package files
COPY user-service/package*.json ./

# Install dependencies and rebuild native modules
RUN npm install --omit=dev && npm rebuild bcrypt --build-from-source

# Copy shared-lib first
COPY shared-lib/ ./shared-lib/

# Copy source code
COPY user-service/ .

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]