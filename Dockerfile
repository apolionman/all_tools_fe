# Build stage
FROM node:20-alpine3.19 AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package and install deps
COPY package*.json ./
ENV HUSKY=0
ENV CI=true
# Install all dependencies including devDependencies
RUN npm install && npm cache clean --force

# Copy config and source files
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY . .

# Set optional build args
# ARG VITE_API_URL
# ARG VITE_API_KEY

# Build
# ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:20-alpine3.19

WORKDIR /app

# Install serve
RUN npm install -g serve && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]