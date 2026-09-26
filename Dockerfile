# Multi-stage Dockerfile for Next-Gen ITSM (Production)
# 1. Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies across all workspaces
RUN npm run install:all

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build frontend and compile backend
RUN npm run build

# 2. Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install OpenSSL for Prisma engine on Alpine
RUN apk add --no-cache openssl

# Copy root and backend package manifests
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies for the backend
RUN cd backend && npm install --omit=dev

# Copy built frontend assets and compiled backend code from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

# Generate Prisma Client for the production environment
RUN cd backend && npx prisma generate

EXPOSE 4000

# Automatically push database schema, run seed (if not yet seeded), and launch server
CMD ["sh", "-c", "cd /app/backend && npx prisma db push --skip-generate && (node dist/prisma/seed.js || true) && node dist/src/index.js"]
