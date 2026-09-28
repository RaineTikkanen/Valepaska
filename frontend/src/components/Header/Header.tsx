import {Link, useLocation} from 'react-router';

function Header({ userName, onLogout }: { userName: string, onLogout: () => void }) {
  const location = useLocation();

  if (location.pathname === '/game') return;
  return (
    <header className="flex flex-row items-center justify-between p-6">
      <Link to="/" 
        className="font-mono text-4xl duration-300 text-shadow-md hover:text-green-600"
      >
        Valepaska
      </Link>
      <a>
        {userName ?
          <div>
            <p>{userName}</p>
            <button className="hover:cursor-pointer" onClick={onLogout}>Kirjaudu ulos</button>
          </div>:
          <p>Kirjaudu</p>
        }
      </a>
    </header>
  );
}

export default Header;
