import React, { useState, useEffect } from 'react';
import { playSuccessChime, playGentleClick, speakText } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Volume2, HelpCircle, Layers, CheckCircle2, RotateCcw, Award } from 'lucide-react';

interface WordPairGameProps {
  currentLevel?: number;
  maxLevel?: number;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

interface MemoryCard {
  id: string;
  pairId: string;
  text: string;
  subtext: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIR_DEFINITIONS = [
  { id: 'chai', textA: 'Morning Chai', subA: 'Warm Brew', textB: 'Cardamom & Ginger', subB: 'Aromatic Spice', icon: 'local_cafe', color: 'text-amber-700', bg: 'bg-amber-50' },
  { id: 'garden', textA: 'Home Garden', subA: 'Fresh Soil', textB: 'Marigold Flowers', subB: 'Golden Blooms', icon: 'yard', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { id: 'fables', textA: 'Bedtime Reading', subA: 'Cozy Night', textB: 'Grandchildren Fables', subB: 'Panchatantra Tales', icon: 'menu_book', color: 'text-blue-700', bg: 'bg-blue-50' },
  { id: 'monsoon', textA: 'Monsoon Clouds', subA: 'First Raindrops', textB: 'Paper Boats & Petrichor', subB: 'Puddle Joy', icon: 'rainy', color: 'text-sky-700', bg: 'bg-sky-50' },
  { id: 'music', textA: 'Classical Raga', subA: 'Evening Melody', textB: 'Sitar & Tanpura', subB: 'Harmonic Strings', icon: 'music_note', color: 'text-purple-700', bg: 'bg-purple-50' },
  { id: 'yoga', textA: 'Morning Yoga', subA: 'Fresh Sunrise', textB: 'Surya Namaskar', subB: 'Deep Pranayama', icon: 'self_improvement', color: 'text-orange-700', bg: 'bg-orange-50' },
  { id: 'sweets', textA: 'Diwali Festival', subA: 'Illumination', textB: 'Earthen Diyas & Halwa', subB: 'Sweet Celebration', icon: 'celebration', color: 'text-rose-700', bg: 'bg-rose-50' },
  { id: 'park', textA: 'Evening Walk', subA: 'Sunset Air', textB: 'Neighborhood Friends', subB: 'Cheerful Catch-up', icon: 'directions_walk', color: 'text-teal-700', bg: 'bg-teal-50' },
];

export const WordPairGame: React.FC<WordPairGameProps> = ({
  currentLevel = 1,
  maxLevel = 3,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [subMode, setSubMode] = useState<'cards' | 'proverbs'>('cards');
  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [score, setScore] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Proverbs / Word Scramble mode
  const [proverbIndex, setProverbIndex] = useState(0);
  const [proverbAnswer, setProverbAnswer] = useState<string[]>([]);
  const [proverbsSolved, setProverbsSolved] = useState(0);

  const PROVERBS = [
    {
      sentence: 'Slow and steady wins the ________.',
      missing: 'race',
      options: ['race', 'water', 'cloud', 'temple'],
      meaning: 'Patience and steady effort always triumph over rushed haste.',
      icon: 'directions_walk',
    },
    {
      sentence: 'Where there is a will, there is a ________.',
      missing: 'way',
      options: ['way', 'shoe', 'song', 'tree'],
      meaning: 'Determination opens pathways even through tough obstacles.',
      icon: 'lightbulb',
    },
    {
      sentence: 'Old friends are like vintage ________.',
      missing: 'gold',
      options: ['gold', 'plastic', 'wind', 'dust'],
      meaning: 'Cherished long-standing friendships only grow more precious with time.',
      icon: 'favorite',
    },
    {
      sentence: 'Early to bed and early to rise makes one healthy, wealthy and ________.',
      missing: 'wise',
      options: ['wise', 'noisy', 'tired', 'slow'],
      meaning: 'A disciplined rhythm of life nurtures peaceful wisdom and health.',
      icon: 'wb_sunny',
    },
  ];

  // Initialize Memory Flip Cards
  const initCards = (lvl = selectedLevel) => {
    // Level 1: 3 pairs (6 cards)
    // Level 2: 4 pairs (8 cards)
    // Level 3: 6 pairs (12 cards)
    const pairCount = lvl === 1 ? 3 : lvl === 2 ? 4 : 6;
    const selectedDefs = PAIR_DEFINITIONS.slice(0, pairCount);

    const deck: MemoryCard[] = [];
    selectedDefs.forEach((def, index) => {
      deck.push({
        id: `${def.id}-a`,
        pairId: def.id,
        text: def.textA,
        subtext: def.subA,
        icon: def.icon,
        colorClass: def.color,
        bgClass: def.bg,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: `${def.id}-b`,
        pairId: def.id,
        text: def.textB,
        subtext: def.subB,
        icon: def.icon,
        colorClass: def.color,
        bgClass: def.bg,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMovesCount(0);
    setMatchesFound(0);
    setIsFinished(false);
    setIsLocked(false);
  };

  useEffect(() => {
    initCards(selectedLevel);
    if (voiceGuidanceEnabled) {
      speakText('Flip the cards to match complementary semantic pairs.', true);
    }
  }, [selectedLevel]);

  // Handle Card Click
  const handleCardClick = (card: MemoryCard) => {
    if (isLocked || card.isFlipped || card.isMatched) return;

    playGentleClick();

    const newCards = cards.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMovesCount((prev) => prev + 1);
      setIsLocked(true);

      const [first, second] = newFlipped;
      if (first.pairId === second.pairId) {
        // MATCH FOUND!
        playSuccessChime();
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        const pts = 25 + selectedLevel * 10;
        setScore((prev) => prev + pts);

        const updatedCards = newCards.map((c) =>
          c.pairId === first.pairId ? { ...c, isMatched: true, isFlipped: true } : c
        );
        setCards(updatedCards);
        setFlippedCards([]);
        setIsLocked(false);
        const nextMatches = matchesFound + 1;
        setMatchesFound(nextMatches);

        const totalPairs = selectedLevel === 1 ? 3 : selectedLevel === 2 ? 4 : 6;

        if (voiceGuidanceEnabled) {
          speakText(`Matched: ${first.text} and ${second.text}!`, true);
        }

        if (nextMatches >= totalPairs) {
          setIsFinished(true);
          playSuccessChime();
          confetti({ particleCount: 100, spread: 80 });
        }
      } else {
        // NO MATCH -> Flip back after delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
          setIsLocked(false);
        }, 1100);
      }
    }
  };

  // Handle Proverb Answer Click
  const handleProverbOption = (word: string) => {
    playGentleClick();
    const currentP = PROVERBS[proverbIndex];
    if (word === currentP.missing) {
      playSuccessChime();
      confetti({ particleCount: 50, spread: 60 });
      setScore((prev) => prev + 35);
      setProverbsSolved((prev) => prev + 1);

      if (voiceGuidanceEnabled) {
        speakText(`Correct! ${currentP.meaning}`, true);
      }

      setTimeout(() => {
        if (proverbIndex + 1 < PROVERBS.length) {
          setProverbIndex((prev) => prev + 1);
        } else {
          setIsFinished(true);
        }
      }, 1800);
    } else {
      if (voiceGuidanceEnabled) {
        speakText('Think about what word makes the most sense.', true);
      }
    }
  };

  const handleClaim = () => {
    playSuccessChime();
    const accuracy = movesCount > 0 ? Math.min(100, Math.round(((matchesFound * 2) / movesCount) * 100)) : 100;
    const pointsEarned = Math.round(score * 0.85) + 30;
    onComplete(score, pointsEarned, accuracy, selectedLevel);
  };

  return (
    <div id="word-pair-game-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#f8f9fc] text-[#002045] w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-[#1a365d]/20 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* Top Header Bar */}
        <div className="bg-[#002045] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#d7e2ff] text-[#002045] rounded-xl flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-[#002045]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Memory Tiles & Word Association</h2>
                <span className="bg-[#facc15] text-[#002045] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Concentration & Language
                </span>
              </div>
              <p className="text-xs text-[#a0c4ff]">Card flip recall, semantic pairs & proverb wisdom</p>
            </div>
          </div>

          <button
            id="close-word-pair-btn"
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="p-2 text-[#a0c4ff] hover:text-white hover:bg-[#1a365d] rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Submode & Level Bar */}
        {!isFinished && (
          <div className="bg-[#e2eafc] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-[#c8d8f8] gap-2">
            <div className="flex items-center space-x-1.5 bg-[#002045] p-1 rounded-xl shadow-xs">
              <button
                onClick={() => {
                  playGentleClick();
                  setSubMode('cards');
                  initCards(selectedLevel);
                }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                  subMode === 'cards' ? 'bg-[#d7e2ff] text-[#002045] shadow-xs' : 'text-[#a0c4ff] hover:text-white'
                }`}
              >
                🎴 Memory Card Flip
              </button>
              <button
                onClick={() => {
                  playGentleClick();
                  setSubMode('proverbs');
                  setProverbIndex(0);
                }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                  subMode === 'proverbs' ? 'bg-[#d7e2ff] text-[#002045] shadow-xs' : 'text-[#a0c4ff] hover:text-white'
                }`}
              >
                📜 Proverb Builder
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs font-bold text-[#002045]">
              {subMode === 'cards' ? (
                <>
                  <span>Matches: {matchesFound} / {selectedLevel === 1 ? 3 : selectedLevel === 2 ? 4 : 6}</span>
                  <span>Flips: {movesCount}</span>
                </>
              ) : (
                <span>Proverb {proverbIndex + 1} of {PROVERBS.length}</span>
              )}
              <span className="bg-[#d7e2ff] text-[#002045] font-black px-2.5 py-1 rounded-md border border-[#a0c4ff]">
                Score: {score}
              </span>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          {isFinished ? (
            <div className="text-center py-6 flex flex-col items-center space-y-5">
              <div className="w-20 h-20 bg-[#d7e2ff] text-[#002045] rounded-full flex items-center justify-center shadow-lg border-4 border-[#002045]">
                <Trophy className="w-10 h-10 text-[#002045]" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#002045]">Memory Match Victor!</h3>
                <p className="text-[#3b5998] text-base mt-1">Superb episodic concentration and language recall!</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm bg-[#eef3fc] p-4 rounded-xl border border-[#c8d8f8]">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987]">Total Score</p>
                  <p className="text-2xl font-black text-[#002045]">{score}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987]">Total Flips</p>
                  <p className="text-2xl font-black text-[#002045]">{movesCount || proverbsSolved}</p>
                </div>
              </div>

              <button
                id="claim-word-reward-btn"
                onClick={handleClaim}
                className="bg-[#002045] hover:bg-[#1a365d] text-white px-8 py-3.5 rounded-xl font-black text-base shadow-lg transition-all"
              >
                Collect Rewards & Finish
              </button>
            </div>
          ) : subMode === 'cards' ? (
            /* CARDS FLIP GRID */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#c8d8f8] shadow-xs">
                <div className="text-xs text-[#556987] font-semibold flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#002045]" />
                  <span>Tap two cards to flip them over and find connected life pairs (e.g. Chai + Cardamom).</span>
                </div>
                <button
                  onClick={() => initCards(selectedLevel)}
                  className="px-3 py-1.5 bg-[#eef3fc] hover:bg-[#d0e0fc] text-[#002045] text-xs font-bold rounded-lg flex items-center space-x-1 border border-[#c8d8f8]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>
              </div>

              <div className={`grid gap-3 sm:gap-4 ${cards.length <= 6 ? 'grid-cols-2 sm:grid-cols-3' : cards.length <= 8 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4'}`}>
                {cards.map((card) => {
                  const isVisible = card.isFlipped || card.isMatched;

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      disabled={card.isMatched || isLocked}
                      className={`h-28 sm:h-36 rounded-2xl border-3 transition-all duration-300 transform perspective-1000 flex flex-col items-center justify-center p-3 text-center cursor-pointer shadow-md ${
                        card.isMatched
                          ? 'bg-emerald-50 border-emerald-500 scale-98 shadow-inner ring-2 ring-emerald-300 opacity-90'
                          : isVisible
                          ? `${card.bgClass} border-[#002045] shadow-lg scale-102`
                          : 'bg-[#002045] border-[#1a365d] hover:bg-[#1a365d] hover:border-[#adc7f7]'
                      }`}
                    >
                      {isVisible ? (
                        <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center justify-center">
                          <span className={`material-symbols-outlined text-[32px] sm:text-[38px] ${card.colorClass} mb-1`}>
                            {card.icon}
                          </span>
                          <p className="text-xs sm:text-sm font-black text-[#002045] leading-tight line-clamp-2">
                            {card.text}
                          </p>
                          <span className="text-[10px] text-[#556987] font-bold mt-0.5">
                            {card.subtext}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-white/70">
                          <span className="material-symbols-outlined text-[36px] text-[#adc7f7]">
                            psychology
                          </span>
                          <span className="text-[11px] font-bold mt-1 text-[#d7e2ff]">SmritiSaathi</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* PROVERB BUILDER MODE */
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border-2 border-[#002045] shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#3b5998]">Proverb & Wisdom Recall</span>
                  <button
                    onClick={() => speakText(PROVERBS[proverbIndex].sentence, true)}
                    className="p-2 bg-[#eef3fc] hover:bg-[#d0e0fc] text-[#002045] rounded-xl border border-[#c8d8f8]"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 bg-[#00142e] rounded-2xl text-center text-white space-y-2 border-2 border-[#1a365d]">
                  <span className="material-symbols-outlined text-[44px] text-[#facc15]">
                    {PROVERBS[proverbIndex].icon}
                  </span>
                  <h3 className="text-2xl font-black tracking-wide text-[#d7e2ff] leading-relaxed">
                    "{PROVERBS[proverbIndex].sentence}"
                  </h3>
                </div>

                <p className="text-xs text-[#556987] font-bold text-center">
                  Select the missing word to complete this timeless saying:
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {PROVERBS[proverbIndex].options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleProverbOption(opt)}
                      className="p-4 bg-[#f8fafd] hover:bg-[#d7e2ff] border-2 border-[#adc7f7] hover:border-[#002045] rounded-xl text-lg font-black text-[#002045] transition-all transform active:scale-95 shadow-sm"
                    >
                      {opt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
