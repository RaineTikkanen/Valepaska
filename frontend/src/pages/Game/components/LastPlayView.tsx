import cardNumbers from '../../../assets/cardNumbers.ts';
import cardImages from '../../../assets/cardImages.ts';
import cardBack from '../../../assets/cardBack.svg';
import { useAppSelector } from '../../../hooks/redux.ts';
import type {Card} from '../../../types/deck.type.ts';
import { selectGameState } from '../gameSlice.ts';
import ClearTimer from './ClearTimer.tsx';

const DoubtResultView = ({doubtWasCorrect, doubtResult}:{doubtWasCorrect: boolean, doubtResult: Array<Card>} ) =>{
  return (
    <div className="flex justify-center">
      <div className="rounded-xl bg-emerald-500 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
        <p>{doubtWasCorrect ? 'Epäily oli oikein!' : 'Epäily oli väärä!'}</p>
        <div className="mt-3 flex max-w-[90vw] flex-wrap justify-center -space-x-16 md:-space-x-20 xl:-space-x-24">
          {doubtResult.map((card) => (
            <img
              key={card.name}
              src={cardImages[card.name]}
              alt={`${card.suit}${card.value}`}
              className="w-20 shadow-md sm:w-30"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const LastPlayView = () => {

  const game = useAppSelector(selectGameState);


  if (!game.lastPlay) return;

  const value = game.lastPlay.statement.value;
  const numberImage = `N${value}` as keyof typeof cardNumbers;

  const amount = game.lastPlay.statement.amount;
  const doubtWasCorrect = game.doubtResult !== null && !game.doubtResult.every((card) => card.value === value);


  return (
    <div className="relative flex w-full flex-1 flex-col items-center  justify-center">
      <div className="absolute flex flex-col">
        {game.doubter && (
          <div className="flex justify-center">
            <div className="rounded-xl bg-emerald-500 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
              {game.doubter} epäilee!!
            </div>
          </div>
        )}
        {game.doubtResult &&
            <DoubtResultView
              doubtWasCorrect={doubtWasCorrect}
              doubtResult={game.doubtResult}
            />
        }
        <ClearTimer />
      </div>

      <div className="my-3 flex min-h-0 flex-1 flex-col items-center justify-center">
        <p>Kortteja pöydässä: {game.amountOfCardsInPlay}</p>
        {game.sameCardsInPlay > 1 && <p>Samoja kortteja : {game.sameCardsInPlay}</p>}
        <img
          src={cardBack}
          alt="Card back"
          className="h-auto w-30  max-w-full object-contain shadow-md sm:w-36 xl:w-40"
        />
        <div className="mt-3 flex items-center sm:my-5">
          {amount >1 && <p className="text-3xl sm:text-5xl">{amount} x</p>}
          <img
            src={cardNumbers[numberImage]}
            alt="Card number"
            className="ml-2 size-6 sm:size-8  "
          />
        </div>
      </div>
    </div>
  );
};

export default LastPlayView;