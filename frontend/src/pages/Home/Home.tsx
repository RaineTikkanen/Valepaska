import { useNavigate } from 'react-router';


function Button ({text, path}:{text:string, path: string}) {
  const navigate = useNavigate();

  return (
    <button className="m-3 w-sm md:w-xl sm:md rounded-xl bg-emerald-400 p-3 hover:bg-emerald-500" onClick={()=>navigate(path)}>
        {text}
      </button>
  )
}

function Home() {
  return (
    <div className="flex justify-center h-100 items-center">
      <div className="flex flex-col">
        <Button text="Pelaa" path={"/game"}/>
        <Button text="Säännöt" path={"/rules"}/>
      </div>
    </div>
  );
}

export default Home;
