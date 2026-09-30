import {Routes, Route, useNavigate, useLocation} from 'react-router';
import Header from './components/Header';

import Game from './pages/Game';
import Home from './pages/Home';
import Rules from './pages/Rules';
import Lobby from './pages/Lobby';
import Results from './pages/Results';
import { useState } from 'react';
import {useAppDispatch, useAppSelector} from './hooks/redux.ts';
import {disconnect, selectSocketState} from './pages/Lobby/socketSlice.ts';


function App() {
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') ?? '');
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useAppSelector(selectSocketState);
  const dispatch = useAppDispatch();

  const logOut = () => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');

    if(socket.roomId){
      dispatch(disconnect());
    }
    setUserName('');
    if(location.pathname !== '/' && location.pathname !== '/rules') {
      void navigate('/');
    }
  };

  return (
    <div>
      <Header userName={userName} onLogout={logOut} />
      <Routes>
        <Route path="/" element={<Home onUserNameChange={setUserName} />} />
        <Route path="/game" element={<Game />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </div>
  );
}

export default App;
