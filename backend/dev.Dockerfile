FROM node:24

WORKDIR /usr/src/app

COPY . .

RUN npm install

ENV DEBUG=socket.io*

CMD ["npm", "run", "dev", "--", "--host"]