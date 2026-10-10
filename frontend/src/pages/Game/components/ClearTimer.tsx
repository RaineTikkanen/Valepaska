import {useAppSelector} from '../../../hooks/redux.ts';
import {selectClearTimer} from '../gameSlice.ts';


const ClearTimer = () => {
  const clearTimer = useAppSelector(selectClearTimer);

  if(clearTimer===-1) return;
  return(
    <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-emerald-500 p-4 shadow-md">
      <p className="text-xl font-bold text-white">Pakka kaatuu</p>
      <p className="text-xl font-bold text-white" >{clearTimer}</p>
    </div>
  );
};

export default ClearTimer;
