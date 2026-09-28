import { useNavigate } from 'react-router';
import { useState } from 'react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import useField from '../../hooks/useField';
import TextInput from '../../components/TextInput';
import logger from '../../utils/logger.ts';


const GuestLogin = ({onClick, onUserNameChange}:{onClick: ()=>void, onUserNameChange: (userName: string) => void}) => {
  const guestUserName = useField('text', 'Käyttäjänimi (4-20 merkkiä)');

  const onNext = () => {
    if(guestUserName.value.length > 3) {
      localStorage.setItem('userName', guestUserName.value);
      onUserNameChange(guestUserName.value);
      onClick();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 ">
      <div className="flex flex-col">
        <TextInput {...guestUserName} minLength={4} maxLength={20} />
        <Button text="Seuraava" onClick={onNext} disabled={guestUserName.value.length < 4} />
      </div>
    </div>
  );
};

const Home =({onUserNameChange}:{onUserNameChange: (userName: string) => void})=> {

  const [visible, setVisible] = useState(false);
  const [guestLoginVisible, setGuestLoginVisible] = useState(false);
  const navigate = useNavigate();

  const toggleModal = () => {
    setVisible(!visible);
    setGuestLoginVisible(false);
  };

  const toggleGuestLogin = () => {
    setGuestLoginVisible(!guestLoginVisible);
  };

  const onPlay= () => {
    if(localStorage.getItem('userName') !== null) {
      void navigate('/lobby');
    }else{
      toggleModal();
    }
  };


  return (
    <div className="flex h-100 items-center justify-center">
      <Modal show={visible} onClose={toggleModal} header= {guestLoginVisible ? 'Anna nimi' : 'Pelaa'}>
        {guestLoginVisible ? <GuestLogin onClick={()=> void navigate('/lobby')} onUserNameChange={onUserNameChange} /> :
          <div className="flex flex-col">
            <Button text="Kirjaudu sisään" onClick={()=>logger.debug('logIn')} disabled />
            <Button text="Pelaa vieraana" onClick={()=> toggleGuestLogin()} />
          </div>
        }
      </Modal>
      <div className="flex w-150 flex-col">
        <Button text="Pelaa" onClick={onPlay} />
        <Button text="Säännöt" onClick={()=> void navigate('/rules')} />
      </div>
    </div>
  );
};

export default Home;
