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

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

# En producción el esquema se crea MANUALMENTE con scripts/sql/01-schema.sql,
# por lo que NO se ejecuta `prisma db push` al arrancar. Solo corre si
# PRISMA_DB_PUSH=true (útil en desarrollo local). Nota: el arranque de la app
# igual asegura roles + admin de forma idempotente vía Prisma Client (runtime).
CMD ["sh", "-c", "if [ \"$PRISMA_DB_PUSH\" = \"true\" ]; then npx prisma db push --skip-generate; fi; exec node dist/src/main.js"]
