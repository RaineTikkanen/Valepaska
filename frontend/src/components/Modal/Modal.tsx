import type { JSX } from 'react';

interface modalProp {
  show: boolean;
  onClose: ()=>void;
  children?: JSX.Element;
  header: string;
}

const Modal= (props: modalProp) => {
  const {show, onClose, children, header} = props;

  return(
    show &&
    <div id="backdrop" className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div id="modalContainer" className="relative mx-4 w-full max-w-md rounded-2xl bg-emerald-200 p-5 shadow-lg  ">
        <div className="absolute top-4 left-4">
          <button className="rounded-sm bg-emerald-400 px-3 py-1 duration-300 hover:cursor-pointer hover:bg-green-400" onClick={onClose} >x</button>
        </div>
        <div className="flex justify-center p-1">
          <h1 className="mb-4 w-full text-center text-xl font-bold">{header}</h1>
        </div>
        <div className="flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
  
};

export default Modal;