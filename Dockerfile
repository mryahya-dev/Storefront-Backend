# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app

# Install ALL deps (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .


# Build the app
RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim
WORKDIR /app

# Install ONLY production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

# Run as non-root
USER node
EXPOSE 3000

CMD ["npm", "start"]
