# The first FROM is now a stage called build-stage
FROM node:24 AS build-stage

WORKDIR /usr/src/app

COPY . .

RUN npm ci

RUN VITE_BACKEND_URL=http://localhost:8080/api/ VITE_WEBSOCKET_URL=http://localhost:8080/ npm run build

FROM nginx:1.29-alpine

COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html