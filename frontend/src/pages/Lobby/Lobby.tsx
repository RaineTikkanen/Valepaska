import { useState, useEffect } from 'react';
import { socket } from '../../socket';
import Button from '../../components/Button';

function Lobby (){

  const [statement, setStatement]=useState('');

  const [statementInput, setStatementInput]=useState('');

  const [cardsInput, setCardsInput]=useState('');

  const [isConnected, setIsConnected]=useState(socket.connected);

  useEffect(()=>{
    console.log('connecting');
    socket.connect();
    socket.on('connect', ()=>setIsConnected(true));
    socket.on('disconnect', ()=>setIsConnected(false));


    return()=>{
      console.log('disconnecting');
      socket.disconnect();
      socket.off('disconnect', ()=>console.log('disconnected'));
      socket.off('connect', ()=>console.log('connected'));
    };
  },[]);

  useEffect(()=>{
    const onUpdate= (statement: string) => {
      console.log(statement);
      setStatement(statement);
      setTimeout(()=>{
        setStatement('');
      },3000);
    };

    socket.on('gameState', onUpdate);

    return () =>{
      socket.off('gameState', onUpdate);
    };
  }, [statement]);


  const onPress = () => {
    if (statementInput && cardsInput){
      console.log('send button pressed. said cards');
      socket.emit('play', cardsInput, statementInput);
      setStatementInput('');
      setCardsInput('');
    }
  };

  console.log(isConnected);

  if (!isConnected){
    return(
      <h2 className="animate-pulse">Connecting...</h2>
    );
  }

  return(
    <div className="flex flex-col">
      <h1>Lobby</h1>
      <label>Pelattava kortti</label>
      <input 
        placeholder="Pelattava kortti"
        value={cardsInput}
        onChange={e => setCardsInput(e.target.value)}
      />
      <label>Väite</label>
      <input 
        placeholder="Väite"
        value={statementInput}
        onChange={e => setStatementInput(e.target.value)}
      />
      <Button text="Pelaa" onClick={()=>onPress()} />
      {statement &&
      <h2>{statement}</h2>}
    </div>
  );
}

export default Lobby;