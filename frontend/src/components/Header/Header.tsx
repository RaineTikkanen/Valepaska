import { Link } from 'react-router';

function Header() {
  return (
    <header className="flex flex-row items-center justify-between py-6">
      <Link to="/" 
        className="animate-colors duration-300 font-mono text-4xl text-shadow-md hover:text-green-600"
      >
        Valepaska
      </Link>
      <a className="">Kirjaudu</a>
    </header>
  );
}

export default Header;
