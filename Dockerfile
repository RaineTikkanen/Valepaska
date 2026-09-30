FROM node:24 AS frontend-build-stage

WORKDIR /usr/src/app

COPY ./frontend .

RUN npm ci

RUN npm run build

FROM node:24 AS backend-build-stage

WORKDIR /usr/src/app

COPY --chown=node:node ./backend .

RUN npm ci

RUN npm run tsc

COPY --from=frontend-build-stage /usr/src/app/dist /usr/src/app/dist

USER node

CMD ["npm", "start"]