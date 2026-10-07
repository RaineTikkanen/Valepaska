import Button from '../Button';
import logger from '../../utils/logger.ts';
import Modal from '../Modal';
import useField from '../../hooks/useField.tsx';
import TextInput from '../TextInput';
import {useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../hooks/redux.ts';
import {selectUserState, closeLogin, updateUserId, updateUserName} from '../../pages/Lobby/userSlice.ts';
import {BACKEND_URL} from '../../utils/config.ts';
import {parseUserId} from '../../utils/typeGuards.ts';

interface GuestLoginProps {
  closeGuestLogin: () => void;
};

const GuestLogin = ({closeGuestLogin}:GuestLoginProps) => {
  const guestUserName = useField('text', 'Käyttäjänimi (4-20 merkkiä)');
  const dispatch = useAppDispatch();

  const onLogin = async () => {
    if(guestUserName.value.length > 3) {
      const userId = await getGuestUserId();
      if(userId) {
        dispatch(updateUserName(guestUserName.value));
        dispatch(updateUserId(userId));
        closeGuestLogin();
        dispatch(closeLogin());
      }else{
        window.alert('Kirjautuminen epäonnistui');
      }
    }
  };

  const getGuestUserId = async (): Promise<string|null> => {
    try {
      const response = await fetch(BACKEND_URL + '/api/userId');
      const result: unknown = await response.json();
      return parseUserId(result);
    } catch (e) {
      if(e && typeof e === 'object') logger.error('ERROR: ', e);
      else logger.error('UNKNOWN ERROR');
      return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 ">
      <div className="flex flex-col">
        <TextInput {...guestUserName} minLength={4} maxLength={20} />
        <Button text="Kirjaudu" onClick={()=> void onLogin()} disabled={guestUserName.value.length < 4} />
      </div>
    </div>
  );
};


const Login = () =>{
  const [guestLoginVisible, setGuestLoginVisible] = useState(false);
  const user = useAppSelector(selectUserState);
  const dispatch = useAppDispatch();

  const toggleGuestLogin = () => {
    setGuestLoginVisible(!guestLoginVisible);
  };

  const onClose = () => {
    setGuestLoginVisible(false);
    dispatch(closeLogin());
  };

  return(
    <div>
      <Modal show={user.showLogin} onClose={onClose} header= {guestLoginVisible ? 'Anna nimi' : 'Pelaa'}>
        {guestLoginVisible ? <GuestLogin closeGuestLogin={()=>setGuestLoginVisible(false)} /> :
          <div className="flex flex-col">
            <Button text="Kirjaudu sisään" onClick={()=>logger.debug('logIn')} disabled />
            <Button text="Pelaa vieraana" onClick={()=> toggleGuestLogin()} />
          </div>
        }
      </Modal>
    </div>
  );
};

export default Login;