# Epaiement.ma - Dockerfile for Google Cloud Run
FROM node:20-alpine AS builder

WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy package files
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build the application
RUN bun run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
