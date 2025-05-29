# Build stage
FROM node:20-alpine3.19 AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat bash python3 curl make g++ libc6-compat

# Copy package and install deps
COPY package*.json ./
ENV HUSKY=0
ENV CI=true
RUN npm install && npm cache clean --force

# Copy config and source files
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY . .

# Set build-time arguments (MUST BE PASSED DURING BUILD)
ARG VITE_BACKEND_BASE_URL
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL

# Build with production optimizations
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:20-alpine3.19

WORKDIR /app

# Install `serve` to serve static files
RUN apk add --no-cache bash python3 curl && \
    npm install -g serve && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start the app (NO ENV NEEDED HERE)
CMD ["serve", "-s", "dist", "-l", "3000"]