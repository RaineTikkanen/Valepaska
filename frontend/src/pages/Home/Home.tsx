import { useNavigate } from 'react-router';
import Button from '../../components/Button';
import {openLogin, selectUserState} from '../Lobby/userSlice.ts';
import {useAppDispatch, useAppSelector} from '../../hooks/redux.ts';
import {useEffect, useState} from 'react';


const Home =()=> {
  const [navigating, setNavigating] = useState(false);
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const user = useAppSelector(selectUserState);

  useEffect(() => {
    if(navigating && user.userId){
      void navigate('/game');
    }
  }, [user.userId, navigating]);

  const onPlay = () => {
    setNavigating(true);
    if(!user.userId){
      dispatch(openLogin());
    }
  };

  return (
    <div className="flex h-100 items-center justify-center">
      <div className="flex w-150 flex-col">
        <Button text="Pelaa" onClick={onPlay} />
        <Button text="Säännöt" onClick={()=> void navigate('/rules')} />
      </div>
    </div>
  );
};

export default Home;
