# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# URL de la API horneada en el build de CRA. Por defecto vacía => baseURL
# relativa (/api) servida por el proxy de nginx. Se puede sobreescribir con
# --build-arg REACT_APP_API_URL=https://api.midominio.com si se despliega el
# backend en otro origen.
ARG REACT_APP_API_URL=""
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
