import { socket } from './socket.js'



const connect = () => {
  socket.connect()
}



export default {
  connect,
}