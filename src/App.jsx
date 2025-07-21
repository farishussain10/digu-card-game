import { useState, useEffect } from "react";

const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function shuffleDeck() {
  const deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push(`${rank}${suit}`);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function dealCards(deck) {
  const hands = [[], [], [], []];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 4; j++) {
      hands[j].push(deck.pop());
    }
  }
  hands[1].push(deck.pop()); // Dealer's partner gets 11
  return { hands, deck, discard: [] };
}

function isMeld(cards) {
  if (cards.length < 3) return false;
  const ranksOnly = cards.map(c => c.slice(0, -1));
  const suitsOnly = cards.map(c => c.slice(-1));

  const isSet = new Set(ranksOnly).size === 1 && new Set(suitsOnly).size === cards.length;

  const suit = suitsOnly[0];
  const sortedByRank = cards
    .filter(c => c.endsWith(suit))
    .map(c => ranks.indexOf(c.slice(0, -1)))
    .sort((a, b) => a - b);

  let isSequence = false;
  if (new Set(suitsOnly).size === 1) {
    isSequence = sortedByRank.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);
  }

  return isSet || isSequence;
}

function cardValue(card) {
  const rank = card.slice(0, -1);
  if (rank === "A") return 1;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank);
}

export default function App() {
  const [deck, setDeck] = useState([]);
  const [hands, setHands] = useState([[], [], [], []]);
  const [discard, setDiscard] = useState([]);
  const [playerTurn, setPlayerTurn] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [meld, setMeld] = useState([]);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const newDeck = shuffleDeck();
    const { hands, deck, discard } = dealCards(newDeck);
    setHands(hands);
    setDeck(deck);
    setDiscard(discard);
  }, []);

  const nextTurn = () => {
    const next = (playerTurn + 1) % 4;
    setPlayerTurn(next);
    if (next !== 0) {
      setTimeout(() => botPlay(next), 1000);
    }
  };

  const botPlay = (idx) => {
    const newHands = [...hands];
    const card = deck.pop();
    newHands[idx].push(card);
    const discardCard = newHands[idx][0];
    newHands[idx].splice(0, 1);
    setHands(newHands);
    setDiscard([discardCard, ...discard]);
    if (checkWin(newHands[idx])) endRound(idx);
    else nextTurn();
  };

  const handleDraw = () => {
    if (deck.length === 0 || playerTurn !== 0) return;
    const newCard = deck.pop();
    const newHands = [...hands];
    newHands[0].push(newCard);
    setHands(newHands);
    setDeck([...deck]);
  };

  const handleDiscard = (card) => {
    if (playerTurn !== 0 || !card) return;
    const newHands = [...hands];
    const cardIndex = newHands[0].indexOf(card);
    if (cardIndex > -1) {
      newHands[0].splice(cardIndex, 1);
      setDiscard([card, ...discard]);
      setHands(newHands);
      setSelectedCard(null);
      if (checkWin(newHands[0])) endRound(0);
      else nextTurn();
    }
  };

  const toggleMeld = (card) => {
    if (!meld.includes(card)) setMeld([...meld, card]);
    else setMeld(meld.filter(c => c !== card));
  };

  const handleMeld = () => {
    if (isMeld(meld)) {
      alert("Valid meld!");
      setMeld([]);
    } else {
      alert("Invalid meld");
    }
  };

  const checkWin = (hand) => {
    return hand.length === 0;
  };

  const endRound = (winnerIndex) => {
    setWinner(winnerIndex === 0 ? "You" : `Player ${winnerIndex + 1}`);
    const penaltyPoints = hands.map((hand, idx) => {
      if (idx === winnerIndex) return 0;
      return hand.reduce((sum, card) => sum + cardValue(card), 0);
    });
    const newScores = scores.map((score, idx) => {
      return idx === winnerIndex
        ? score + 100
        : score - penaltyPoints[idx];
    });
    setScores(newScores);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Digu Card Game Prototype</h1>

      <div>
        <h2 className="text-xl">Your Hand</h2>
        <div className="flex flex-wrap gap-2">
          {hands[0].map((card, idx) => (
            <div
              key={idx}
              className={`cursor-pointer p-2 border rounded ${
                selectedCard === card ? "border-blue-500" : "border-gray-300"
              } ${meld.includes(card) ? "bg-yellow-200" : ""}`}
              onClick={() => {
                setSelectedCard(card);
                toggleMeld(card);
              }}
            >
              {card}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleDraw} disabled={playerTurn !== 0}>Draw</button>
        <button onClick={() => handleDiscard(selectedCard)} disabled={!selectedCard || playerTurn !== 0}>Discard</button>
        <button onClick={handleMeld} disabled={meld.length < 3}>Check Meld</button>
      </div>

      <div>
        <h2 className="text-lg mt-4">Discard Pile</h2>
        <div className="flex gap-2">
          {discard.slice(0, 5).map((card, idx) => (
            <div key={idx} className="p-2 border">{card}</div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Scoreboard</h2>
        <ul>
          <li>You: {scores[0]} pts</li>
          <li>Player 2: {scores[1]} pts</li>
          <li>Player 3: {scores[2]} pts</li>
          <li>Player 4: {scores[3]} pts</li>
        </ul>
      </div>

      {winner && <div className="text-green-600 font-bold text-xl">{winner} won the round!</div>}
    </div>
  );
}

