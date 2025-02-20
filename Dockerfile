FROM node:lts-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the code
COPY common ./common
COPY server ./server
COPY client ./client
COPY *.js ./

# Build client files
ARG VITE_BASE_URL
RUN npx vite build

# Start the server
CMD ["node", "server"]
