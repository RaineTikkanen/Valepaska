import cardNumbers from '../../assets/cardNumbers.js';
import cardImages from '../../assets/cardImages.js';
import cardBack from '../../assets/cardBack.svg';
import Timer from '../../components/Timer';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setAboutToClear } from './gameSlice.js';



const LastPlayView = () => {

  const game = useAppSelector((state)=> state.game);
  const dispatch = useAppDispatch();


  if (game.lastPlay.statement.value === 0 || game.lastPlay.statement.amount === 0) return;

  const value = game.lastPlay.statement.value;
  const numberImage = `N${value}` as keyof typeof cardNumbers;

  const amount = game.lastPlay.statement.amount;
  const doubtWasCorrect = game.doubtResult !== null && !game.doubtResult.every((card) => card.value === value);

  const showAceTimer = game.aboutToClear;

  console.log('doubtResult: ', game.doubtResult);
  console.log('showAceTimer: ', showAceTimer);

  return (
    <div className="relative">
      {game.doubter !== '' && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-red-600 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            {game.doubter} epäilee!!
          </div>
        </div>
      )}
      {game.doubtResult !== null && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-amber-500 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            <p>{doubtWasCorrect ? 'Epäily oli oikein!' : 'Epäily oli väärä!'}</p>
            <div className="mt-3 flex max-w-[90vw] flex-wrap justify-center gap-2">
              {game.doubtResult.map((card) => (
                <img
                  key={card.name}
                  src={cardImages[card.name]}
                  alt={`${card.suit}${card.value}`}
                  className="h-24 w-auto shadow-md"
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {showAceTimer && (
        <div className="flex-row absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-blue-600 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            Pakka kaatuu
          </div>
          <Timer 
            duration={7} 
            onComplete={()=>{dispatch(setAboutToClear(false));}}
          />
        </div>
      )}
      
      <div className="flex flex-col h-100 items-center justify-center my-3"> 
        <p>Kortteja pöydässä: {game.amountOfCardsInPlay}</p>
        {game.sameCardsInPlay > 1 && <p>Samoja kortteja : {game.sameCardsInPlay}</p>}
        <img
          src={cardBack}
          alt="Card back"
          className="w-24 sm:w-36  max-w-full h-auto object-contain shadow-md"
        />
        <div className="flex items-center my-5">
          {amount >1 && <p className="text-5xl">{amount} x</p>}
          <img
            src={cardNumbers[numberImage]}
            alt="Card number"
            className="size-9 ml-2"
          />
        </div>
      </div>
    </div>
  );
};

export default LastPlayView;