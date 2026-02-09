
function Button({text, onClick}:{text:String, onClick:Function}) {
  return (
    <button className="transition-all duration-300 m-3 rounded-xl bg-emerald-400 p-3 hover:bg-green-400 hover:cursor-pointer flex-1 " onClick={()=>onClick()}>
      {text}
    </button>
  );
}

export default Button;
