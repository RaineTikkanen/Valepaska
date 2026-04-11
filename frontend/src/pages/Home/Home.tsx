import { useNavigate } from 'react-router';
import { useState } from 'react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

function Home() {

  const [visible, setVisible] = useState(false);

  const toggleModal = () => {
    setVisible(!visible);
  };

  const navigate = useNavigate();
  return (
    <div className="flex h-100 items-center justify-center">
      <Modal show={visible} onClose={toggleModal} header="Pelaa">
        <div className="flex flex-col">
          <Button text="Kirjaudu sisään" onClick={()=>console.log('logIn')} disabled={1===1} />
          <Button text="Pelaa vieraana" onClick={()=> void navigate('/lobby')} />
        </div>
      </Modal>
      <div className="flex w-150 flex-col">
        <Button text="Pelaa" onClick={toggleModal} />
        <Button text="Säännöt" onClick={()=> void navigate('/rules')} />
      </div>
    </div>
  );
}

export default Home;
