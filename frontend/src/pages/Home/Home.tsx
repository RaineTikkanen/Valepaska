import { useNavigate } from 'react-router';
import Button from '../../components/Button';

function Home() {
  const navigate = useNavigate();
  
  return (
    <div className="flex h-100 items-center justify-center">
      <div className="flex w-150 flex-col">
        <Button text="Pelaa" onClick={()=>navigate('/game')} />
        <Button text="Säännöt" onClick={()=>navigate('/rules')} />
      </div>
    </div>
  );
}

export default Home;
