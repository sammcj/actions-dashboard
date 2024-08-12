### Base Image ###
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# hadolint ignore=DL3018
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

### Rebuild the source code only when needed ###
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_LEVEL=debug

RUN npm run build


### Production Image ###
FROM base AS production

LABEL org.opencontainers.image.authors="Sam McLeod (@sammcj), Aditya Moghe (@twobitnibble)"
LABEL org.opencontainers.image.title="Github Actions Dashboard"
LABEL org.opencontainers.image.description="A dashboard for your Github Actions"

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_LEVEL=warn

RUN \
  addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME localhost

CMD ["node", "server.js"]
