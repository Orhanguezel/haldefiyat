FROM oven/bun:1.2.22-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN HUSKY=0 bun install --frozen-lockfile || HUSKY=0 bun install

FROM deps AS builder
WORKDIR /app
COPY . .
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3030
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3030

CMD ["node", "server.js"]
