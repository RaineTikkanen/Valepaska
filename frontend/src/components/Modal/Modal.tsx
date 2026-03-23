import Button from '../Button';
import type { JSX } from 'react';

interface modalProp {
  show: boolean;
  onClose: ()=>void;
  children?: JSX.Element;
  header: string;
}

const Modal: React.FC<modalProp> = ({show, onClose, children, header}) => {


  return(
    show &&
    <div id="backdrop" className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div id="modalContainer" className="mx-4 w-full max-w-md rounded-2xl bg-emerald-200 p-5 shadow-lg relative  ">
        <div className="absolute top-4 left-4">
          <button className='bg-emerald-400 rounded-sm px-3 py-1 hover:bg-green-400 hover:cursor-pointer duration-300' onClick={onClose} >x</button>
        </div>
        <div className='flex p-1 justify-center'>
          <h1 className="mb-4 text-xl font-bold text-center w-full">{header}</h1>
        </div>
        <div className='flex flex-col'>
          {children}
        </div>
      </div>
    </div>
  );
  
};

export default Modal;