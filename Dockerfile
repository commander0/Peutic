# CTO Blueprint Phase 1: Modular Architecture & Stateless Containers
# Multi-stage build for scalable Kubernetes deployment

# STAGE 1: Dependency Resolution
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# STAGE 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate strict build bundle
RUN npm run build

# STAGE 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 viterealm

COPY --from=builder /app/dist ./dist
# For a Vite/React SPA, this would normally be served via Nginx in production, 
# or via an express server wrapper. We use a lightweight static server here.
RUN npm install -g serve

USER viterealm
EXPOSE 3000

# Zero-Trust execution
CMD ["serve", "-s", "dist", "-l", "3000"]
