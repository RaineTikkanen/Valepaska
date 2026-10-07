import {Link, useLocation} from 'react-router';
import {useAppDispatch, useAppSelector} from '../../hooks/redux.ts';
import {clearUser, selectUserState, openLogin} from '../../pages/Lobby/userSlice.ts';
import {leaveRoom} from '../../pages/Lobby/socketSlice.ts';

function Header() {
  const location = useLocation();
  const user = useAppSelector(selectUserState);
  const dispatch = useAppDispatch();

  const onLogout = () => {
    dispatch(clearUser());
    dispatch(leaveRoom());
  };

  if (location.pathname === '/game') return;

  return (
    <header className="flex flex-row items-center justify-between p-6">
      <Link to="/" 
        className="font-mono text-4xl duration-300 text-shadow-md hover:text-green-600"
      >
        Valepaska
      </Link>
      <a>
        {user.userId ?
          <div>
            <p>{user.userName}</p>
            <button className="hover:cursor-pointer" onClick={onLogout}>Kirjaudu ulos</button>
          </div>:
          <p className="hover:cursor-pointer" onClick={()=>dispatch(openLogin())}>Kirjaudu</p>
        }
      </a>
    </header>
  );
}

export default Header;
