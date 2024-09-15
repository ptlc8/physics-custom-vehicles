FROM node:lts-slim

WORKDIR /app

# Copy the code
COPY package*.json ./
COPY *.js ./
COPY scripts ./scripts
COPY static ./static

# Install dependencies
RUN npm ci

# Expose the port
EXPOSE 13029

# Start the server
CMD ["node", "server.js"]