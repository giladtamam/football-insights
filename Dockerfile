# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client (use dummy URL for generation - it doesn't connect)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run db:generate --workspace=packages/database

# Build packages first (database and shared)
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/shared

# Build API
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files first
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy the built packages with their dist folders
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy Prisma schema
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Copy API dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy node_modules (includes workspace symlinks)
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Run migrations and start the API
CMD ["sh", "-c", "cd packages/database && npx prisma db push --skip-generate && cd /app && node apps/api/dist/server.js"]


