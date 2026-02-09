
function Button({text, onClick}:{text:string, onClick:()=>void}) {
  return (
    <button className="m-3 flex-1 rounded-xl bg-emerald-400 p-3 duration-300 hover:cursor-pointer hover:bg-green-400 " onClick={()=>onClick()}>
      {text}
    </button>
  );
}

export default Button;
