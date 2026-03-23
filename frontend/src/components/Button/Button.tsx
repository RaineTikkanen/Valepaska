
const Button = (
  {text, onClick, disabled}:
  {text:string, onClick:()=>void, disabled?: boolean}) => {
  const baseClass ='m-3 flex-1 rounded-xl p-3 duration-300 ';
  const defaultClass = baseClass.concat('bg-emerald-400 hover:bg-green-400 hover:cursor-pointer');
  const disabledClassName=baseClass.concat('bg-emerald-200');
  return (
    <button 
      className={disabled ? disabledClassName : defaultClass}
      onClick={()=>onClick()}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
