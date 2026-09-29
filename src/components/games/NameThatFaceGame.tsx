import React, { useState, useEffect } from 'react';
import type { FamilyFaceItem } from '../../types';
import { playSuccessChime, playGentleClick, speakText } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Volume2, HelpCircle, Eye, CheckCircle2, UserCheck, Heart, MapPin, Cake } from 'lucide-react';

interface NameThatFaceGameProps {
  faces: FamilyFaceItem[];
  currentLevel?: number;
  maxLevel?: number;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const NameThatFaceGame: React.FC<NameThatFaceGameProps> = ({
  faces,
  currentLevel = 1,
  maxLevel = 3,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Stage 2: Episodic Memory Question after identifying face
  const [currentStage, setCurrentStage] = useState<'name' | 'detail'>('name');
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
  const [isDetailChecked, setIsDetailChecked] = useState(false);

  // Scratch / Clarity Reveal multiplier
  const [revealedTiles, setRevealedTiles] = useState<number[]>([0, 1, 2, 3]); // all revealed by default, or level 3 tiles

  const activeFaces = React.useMemo(() => {
    if (!faces || faces.length === 0) return [];
    return faces;
  }, [faces]);

  const currentFace = activeFaces[currentIndex] || activeFaces[0] || faces[0];
  const totalRounds = activeFaces.length || 3;

  // Generate name options
  const options = React.useMemo(() => {
    if (!currentFace) return [];
    const correctName = currentFace.name;
    const otherNames = faces.filter((f) => f.id !== currentFace.id).map((f) => f.name);
    const pool = Array.from(
      new Set([
        ...otherNames,
        'Pooja Devi',
        'Rohan Sharma',
        'Ananya Sharma',
        'Sunita Rao',
        'Vikram Verma',
        'Meera Devi',
        'Rajesh Kumar',
      ])
    );
    const distractors = pool.filter((n) => n !== correctName);
    const count = selectedLevel === 1 ? 1 : 3;
    const chosen = [correctName, ...distractors.slice(0, count)];
    return chosen.sort(() => (Math.sin((currentIndex + 1) * 3.7) > 0 ? 1 : -1));
  }, [currentFace, faces, currentIndex, selectedLevel]);

  // Stage 2: Detail / Episodic Memory Questions
  const detailQuestion = React.useMemo(() => {
    if (!currentFace) return null;
    return {
      prompt: `What is ${currentFace.name}'s relation or memorable bond with you?`,
      correct: currentFace.relation,
      options: [
        currentFace.relation,
        'Old College Roommate',
        'Neighborhood Doctor',
        'Childhood Tennis Partner',
      ].sort(() => (Math.sin(currentIndex * 5) > 0 ? 1 : -1)),
    };
  }, [currentFace, currentIndex]);

  useEffect(() => {
    if (currentFace && voiceGuidanceEnabled && !isFinished) {
      if (currentStage === 'name') {
        speakText(`Look closely at this family photo. Who is this?`, true);
      } else {
        speakText(`Now, what is ${currentFace.name}'s relation to you?`, true);
      }
    }
  }, [currentIndex, currentFace, voiceGuidanceEnabled, isFinished, currentStage]);

  const handleSelectOption = (name: string) => {
    if (isAnswerChecked) return;
    playGentleClick();
    setSelectedOption(name);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || isAnswerChecked) return;
    setIsAnswerChecked(true);
    const isCorrect = selectedOption === currentFace.name;

    if (isCorrect) {
      playSuccessChime();
      const pts = selectedLevel === 1 ? 25 : selectedLevel === 2 ? 35 : 45;
      setScore((prev) => prev + pts);
      setCorrectCount((prev) => prev + 1);

      if (voiceGuidanceEnabled) {
        speakText(`Splendid! That is indeed ${currentFace.name}.`, true);
      }

      // Move to Stage 2 (Episodic Recall)
      setTimeout(() => {
        setCurrentStage('detail');
      }, 1200);
    } else {
      if (voiceGuidanceEnabled) {
        speakText(`That was a good attempt. This is ${currentFace.name}, your ${currentFace.relation}.`, true);
      }
    }
  };

  const handleSelectDetail = (detail: string) => {
    if (isDetailChecked) return;
    playGentleClick();
    setSelectedDetail(detail);
    setIsDetailChecked(true);

    const isCorrect = detail === currentFace.relation;
    if (isCorrect) {
      playSuccessChime();
      confetti({ particleCount: 40, spread: 60 });
      setScore((prev) => prev + 25);
      if (voiceGuidanceEnabled) {
        speakText(`Wonderful memory! ${currentFace.name} is your beloved ${currentFace.relation}.`, true);
      }
    }
  };

  const handleNextRound = () => {
    playGentleClick();
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setShowHint(false);
    setCurrentStage('name');
    setSelectedDetail(null);
    setIsDetailChecked(false);

    if (currentIndex + 1 < totalRounds) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      playSuccessChime();
      confetti({ particleCount: 90, spread: 80 });
    }
  };

  const handleClaimRewards = () => {
    playSuccessChime();
    const accuracy = totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 100;
    const pointsEarned = Math.round(score * 0.85) + 35;
    onComplete(score, pointsEarned, accuracy, selectedLevel);
  };

  return (
    <div id="name-face-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#f8f9fc] text-[#002045] w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-[#1a365d]/20 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* Header */}
        <div className="bg-[#002045] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#d7e2ff] text-[#002045] rounded-xl flex items-center justify-center shadow-inner">
              <UserCheck className="w-6 h-6 text-[#002045]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Name That Face & Family Memories</h2>
                <span className="bg-[#facc15] text-[#002045] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  2-Stage Episodic Recall
                </span>
              </div>
              <p className="text-xs text-[#a0c4ff]">Recognize loved ones, kinship bonds & warm shared stories</p>
            </div>
          </div>

          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="p-2 text-[#a0c4ff] hover:text-white hover:bg-[#1a365d] rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Level & Progress Bar */}
        {!isFinished && (
          <div className="bg-[#e2eafc] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-[#c8d8f8] gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-[#002045] uppercase">Difficulty:</span>
              <div className="flex space-x-1">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      playGentleClick();
                      setSelectedLevel(lvl);
                      setCurrentIndex(0);
                      setSelectedOption(null);
                      setIsAnswerChecked(false);
                      setCurrentStage('name');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-md border ${
                      selectedLevel === lvl ? 'bg-[#002045] text-white border-[#002045]' : 'bg-white text-[#002045] border-[#c8d8f8]'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-bold text-[#002045]">
              <span>Photo {currentIndex + 1} of {totalRounds}</span>
              <span className="bg-[#d7e2ff] px-2.5 py-1 rounded-md text-[#002045] font-black border border-[#a0c4ff]">
                Score: {score} pts
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
                <h3 className="text-3xl font-black text-[#002045]">Family Memories Celebrated!</h3>
                <p className="text-[#3b5998] text-base mt-1">You recognized your loved ones and strengthened emotional neural pathways.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm bg-[#eef3fc] p-4 rounded-xl border border-[#c8d8f8]">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987]">Total Score</p>
                  <p className="text-2xl font-black text-[#002045]">{score}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987]">Accuracy</p>
                  <p className="text-2xl font-black text-[#002045]">{Math.round((correctCount / totalRounds) * 100)}%</p>
                </div>
              </div>

              <button
                id="claim-face-reward-btn"
                onClick={handleClaimRewards}
                className="bg-[#002045] hover:bg-[#1a365d] text-white px-8 py-3.5 rounded-xl font-black text-base shadow-lg transition-all"
              >
                Collect Rewards & Finish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Photo Display Card */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[280px] aspect-[4/5] rounded-2xl overflow-hidden border-4 border-[#002045] shadow-xl bg-[#00142e]">
                  <img
                    src={currentFace.photoUrl}
                    alt={currentFace.name}
                    className="w-full h-full object-cover"
                  />
                  {currentFace.audioCue && (
                    <button
                      onClick={() => speakText(currentFace.audioCue || '', true)}
                      className="absolute bottom-3 right-3 p-2 bg-[#002045]/80 hover:bg-[#002045] text-white rounded-xl backdrop-blur-sm shadow-md"
                      title="Audio Cue"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {showHint && (
                  <div className="mt-3 bg-[#fffbeb] border border-[#fde68a] text-[#78350f] p-3 rounded-xl text-xs font-medium max-w-[280px]">
                    💡 <strong>Hint:</strong> {currentFace.clue || `This person is your ${currentFace.relation}.`}
                  </div>
                )}
              </div>

              {/* Interactive Multi-Stage Questions */}
              <div className="md:col-span-7 space-y-4">
                
                {currentStage === 'name' ? (
                  /* STAGE 1: IDENTIFY NAME */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#3b5998]">Stage 1 • Facial Recognition</span>
                        <h3 className="text-2xl font-black text-[#002045]">Who is this loved one?</h3>
                      </div>
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#002045] rounded-xl text-xs font-bold border border-[#cbd5e1] flex items-center space-x-1"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>{showHint ? 'Hide Clue' : 'Show Clue'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.map((name) => {
                        const isSelected = selectedOption === name;
                        let btnStyle = 'bg-white border-[#c8d8f8] text-[#002045] hover:border-[#002045]';

                        if (isAnswerChecked) {
                          if (name === currentFace.name) {
                            btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300 font-black';
                          } else if (isSelected) {
                            btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-[#d7e2ff] border-[#002045] text-[#002045] font-black ring-2 ring-[#002045]';
                        }

                        return (
                          <button
                            key={name}
                            onClick={() => handleSelectOption(name)}
                            disabled={isAnswerChecked}
                            className={`p-4 rounded-xl border-2 text-left font-bold text-base transition-all shadow-sm flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{name}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-[#002045]" />}
                          </button>
                        );
                      })}
                    </div>

                    {!isAnswerChecked ? (
                      <button
                        onClick={handleCheckAnswer}
                        disabled={!selectedOption}
                        className="w-full bg-[#002045] hover:bg-[#1a365d] disabled:opacity-50 text-white py-3.5 rounded-xl font-black text-base shadow-md transition-all"
                      >
                        Confirm Name
                      </button>
                    ) : selectedOption !== currentFace.name ? (
                      <button
                        onClick={handleNextRound}
                        className="w-full bg-[#002045] hover:bg-[#1a365d] text-white py-3.5 rounded-xl font-black text-base shadow-md transition-all"
                      >
                        Continue to Next Photo
                      </button>
                    ) : null}
                  </div>
                ) : (
                  /* STAGE 2: EPISODIC BOND RECALL */
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-[#dcfce7] p-3.5 rounded-xl border border-[#86efac] text-[#14532d] flex items-center space-x-2 text-sm font-black">
                      <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                      <span>{currentFace.name} identified! Now recall your kinship bond:</span>
                    </div>

                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#3b5998]">Stage 2 • Episodic Kinship Recall</span>
                      <h3 className="text-xl font-black text-[#002045]">{detailQuestion?.prompt}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {detailQuestion?.options.map((opt) => {
                        const isSelected = selectedDetail === opt;
                        let btnStyle = 'bg-white border-[#c8d8f8] text-[#002045] hover:border-[#002045]';

                        if (isDetailChecked) {
                          if (opt === currentFace.relation) {
                            btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300 font-black';
                          } else if (isSelected) {
                            btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                          }
                        }

                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectDetail(opt)}
                            disabled={isDetailChecked}
                            className={`p-3.5 rounded-xl border-2 text-left font-bold text-sm transition-all shadow-sm flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {opt === currentFace.relation && isDetailChecked && (
                              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isDetailChecked && (
                      <button
                        onClick={handleNextRound}
                        className="w-full bg-[#002045] hover:bg-[#1a365d] text-white py-3.5 rounded-xl font-black text-base shadow-md transition-all animate-in fade-in"
                      >
                        {currentIndex + 1 < totalRounds ? 'Next Family Member →' : 'See Results'}
                      </button>
                    )}
                  </div>
                )}

              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
