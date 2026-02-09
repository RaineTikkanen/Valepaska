import { Routes, Route } from 'react-router';
import Header from '../components/Header';

import Game from '../pages/Game';
import Home from '../pages/Home';
import Rules from '../pages/Rules';

function App() {
  return (
    <div className='h-screen p-5'>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/rules" element={<Rules />} />
      </Routes>
    </div>
  );
}

export default App;
