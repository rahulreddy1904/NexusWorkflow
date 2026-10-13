# ===============================================
# NEXUS WORKFLOW: Production Multi-Stage Container
# ===============================================

# 1. Build Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# 2. Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 3. Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/src/db/migrations ./backend/dist/db/migrations
COPY --from=backend-builder /app/backend/src/db/migrations ./backend/src/db/migrations

# Expose API port
EXPOSE 5000

CMD ["node", "backend/dist/index.js"]
