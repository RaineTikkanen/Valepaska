import type { Card, Play } from '../../types/game.js';
import cardNumbers from '../../assets/cardNumbers.js';
import cardImages from '../../assets/cardImages.js';
import cardBack from '../../assets/cardBack.svg';
import Timer from '../../components/Timer';


interface lastPlayViewProps { 
  lastPlay: Play, 
  amountOfCardsInPlay: number, 
  sameCardsInPlay: number,
  doubter: string, 
  doubtResult: Card[] | null,
  aboutToClear: boolean,
};

const LastPlayView = (props: lastPlayViewProps) => {
  const lastPlay = props.lastPlay; 
  const amountOfCardsInPlay = props.amountOfCardsInPlay; 
  const sameCardsInPlay = props.sameCardsInPlay;
  const doubter = props.doubter;
  const doubtResult = props.doubtResult;
  const aboutToClear = props.aboutToClear;

  if (lastPlay.statement.value === 0 || lastPlay.statement.amount === 0) return;

  const value = lastPlay.statement.value;
  const numberImage = `N${value}` as keyof typeof cardNumbers;

  const amount = lastPlay.statement.amount;
  const doubtWasCorrect = doubtResult !== null && !doubtResult.every((card) => card.value === value);

  const showAceTimer = (aboutToClear);

  console.log('doubtResult: ', doubtResult);
  console.log('showAceTimer: ', showAceTimer);

  return (
    <div className="relative">
      {doubter !== '' && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-red-600 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            {doubter} epäilee!!
          </div>
        </div>
      )}
      {doubtResult !== null && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-amber-500 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            <p>{doubtWasCorrect ? 'Epäily oli oikein!' : 'Epäily oli väärä!'}</p>
            <div className="mt-3 flex max-w-[90vw] flex-wrap justify-center gap-2">
              {doubtResult.map((card) => (
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
          <Timer duration={7} />
        </div>
      )}
      
      <div className="flex flex-col h-100 items-center justify-center my-3"> 
        <p>Kortteja pöydässä: {amountOfCardsInPlay}</p>
        {sameCardsInPlay > 1 && <p>Samoja kortteja : {sameCardsInPlay}</p>}
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