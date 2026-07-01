# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-slim AS production

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl default-mysql-client && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/main.js"]
