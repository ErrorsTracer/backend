# Build stage
FROM oven/bun:1 AS builder

WORKDIR /usr/src/app

# Only needed for build
RUN bun add -g @nestjs/cli

COPY package*.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

# Production image
FROM oven/bun:1

WORKDIR /usr/src/app

# Copy built code
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/bun.lock ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY .env .env

# No need to install again
CMD ["node", "dist/main.js"]
