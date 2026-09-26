import { Routes, Route } from 'react-router';
import Header from './components/Header';

import Game from './pages/Game';
import Home from './pages/Home';
import Rules from './pages/Rules';
import Lobby from './pages/Lobby';
import Results from './pages/Results';

function App() {
  return (
    <div className="h-screen p-5">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </div>
  );
}

export default App;
