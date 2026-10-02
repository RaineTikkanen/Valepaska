# Valepaska Card Game
*Project for FullStackOpen-course (University of Helsinki)*

This is a project made for FullStackOpen-course. It is a Finnish card game called "Valepaska".

##  Game running in: [valepaska.fly.dev](https://valepaska.fly.dev/)

### Installation
```
cd backend && npm i && cd ..
cd frontend && npm i && cd ..
```
### Running in development mode
```
docker compose -f docker-compose.dev.yml up -d
```

### Running in prod mode
```
docker compose -f docker-compose.yml up -d --build
```

### Technologies and libraries
##### Frontend:
- React
- Tailwind Css
- Redux for state manegement
- Socket.io for websocket connection

##### Backend:
- Node.js
- express
- Socket.io for websocket server
- pino for logging
- uuid for unique id creation

---
Card svg graphics from: https://totalnonsense.com/open-source-vector-playing-cards/
