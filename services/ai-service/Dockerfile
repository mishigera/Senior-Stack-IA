FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY services ./services
RUN npx tsc -p services/tsconfig.json

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/dist ./services/dist

ENV NODE_ENV=production
CMD ["node", "services/dist/ai-service/index.js"]