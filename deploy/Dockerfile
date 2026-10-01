FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:server

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 WRTBU_HOST=node WRTBU_DATABASE_PATH=/data/wrtbu.sqlite
RUN mkdir /data && chown node:node /data && chmod 700 /data
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/lib/node-database.mjs ./lib/node-database.mjs
COPY --from=build --chown=node:node /app/scripts/server-migrate.mjs ./scripts/server-migrate.mjs
USER node
EXPOSE 3000
CMD ["sh","-c","node scripts/server-migrate.mjs && node server.js"]
