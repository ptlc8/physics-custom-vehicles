FROM node:lts-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the code
COPY common ./common
COPY server ./server
COPY client ./client
COPY *.js ./

# Start the server
CMD ["node", "server"]
