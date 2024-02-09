# One image, one process — API and UI ship together.
FROM node:20-bookworm-slim AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:20-bookworm-slim AS api
WORKDIR /api
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production STATIC_DIR=/app/public PORT=4000
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=api /api/dist ./dist
COPY --from=web /web/dist ./public
EXPOSE 4000
CMD ["node", "dist/index.js"]
