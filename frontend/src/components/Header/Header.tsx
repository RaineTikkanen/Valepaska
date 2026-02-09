import { Link } from 'react-router';

function Header() {
  return (
    <header className='flex flex-row space-between py-6 justify-between items-center'>
      <Link to="/" 
      className='font-mono text-4xl text-shadow-md hover:text-emerald-700'>
        Valepaska
      </Link>
      <a className=''>Kirjaudu</a>
    </header>
  );
}

export default Header;
