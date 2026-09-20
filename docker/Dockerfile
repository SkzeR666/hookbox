# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/ui/package.json ./packages/ui/

RUN npm install

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/packages/database
RUN npm run db:generate:postgres

WORKDIR /app/apps/web
RUN npm run build

# ---- run ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.* ./apps/web/
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json /app/turbo.json ./

EXPOSE 3000

CMD ["node", "apps/web/server.js"]