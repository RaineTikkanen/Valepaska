import { Link, useLocation } from 'react-router';

function Header() {
  const location = useLocation();
  if (location.pathname === '/game') return;
  return (
    <header className="flex flex-row items-center justify-between py-6">
      <Link to="/" 
        className="font-mono text-4xl duration-300 text-shadow-md hover:text-green-600"
      >
        Valepaska
      </Link>
      <a className="">Kirjaudu</a>
    </header>
  );
}

export default Header;
