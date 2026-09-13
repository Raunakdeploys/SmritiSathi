import React, { useState } from 'react';
import { playSuccessChime, playGentleClick, speakText } from '../utils/audio';
import confetti from 'canvas-confetti';

interface DailyTrainingModalProps {
  onCompleteAll: (bonusPoints: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const DailyTrainingModal: React.FC<DailyTrainingModalProps> = ({
  onCompleteAll,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [step, setStep] = useState<number>(0);
  const [drill1Choice, setDrill1Choice] = useState<string | null>(null);
  const [drill2Choice, setDrill2Choice] = useState<string | null>(null);
  const [drill3Choice, setDrill3Choice] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFinishTraining = () => {
    setIsCompleted(true);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    playSuccessChime();
  };

  const handleSaveAndClose = () => {
    onCompleteAll(150);
  };

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-[#002045]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-[#ffffff] rounded-2xl border-2 border-[#002045] p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-6">
          <div className="w-24 h-24 bg-[#ffdeaa] border-3 border-[#f8bc4b] rounded-full flex items-center justify-center mx-auto text-[#2d1d00] shadow-sm">
            <span className="material-symbols-outlined filled-icon text-[50px]">verified</span>
          </div>

          <h2 className="font-extrabold text-[28px] text-[#002045]">Daily Training Completed!</h2>
          <p className="text-[19px] text-[#43474e]">
            Congratulations Asha Devi! All three cognitive lobes (Memory, Attention, Planning) were stimulated.
          </p>

          <div className="bg-[#f0f3ff] p-5 rounded-2xl border border-[#d9e3f9] space-y-2 text-left">
            <div className="flex justify-between font-bold text-[17px] text-[#002045]">
              <span>🧠 Memory Score</span>
              <span className="text-emerald-700">85% (+5%)</span>
            </div>
            <div className="flex justify-between font-bold text-[17px] text-[#002045]">
              <span>👁️ Attention Score</span>
              <span className="text-emerald-700">75% (+10%)</span>
            </div>
            <div className="flex justify-between font-bold text-[17px] text-[#002045]">
              <span>🧭 Planning Score</span>
              <span className="text-emerald-700">65% (+25%)</span>
            </div>
          </div>

          <button
            onClick={handleSaveAndClose}
            className="w-full bg-[#002045] hover:bg-[#1a365d] text-white py-4 rounded-xl font-bold text-[20px] min-h-[60px] cursor-pointer shadow-md"
          >
            Claim +150 Mind Points
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#002045]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#ffffff] rounded-2xl border-2 border-[#002045] p-5 sm:p-7 max-w-2xl w-full shadow-2xl my-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#c4c6cf]">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-[#002045] text-[32px]">psychology</span>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[24px] text-[#002045]">
                Daily Guided Cognitive Workout
              </h2>
              <p className="text-sm text-[#43474e]">Drill {step + 1} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#43474e] hover:bg-[#f0f3ff] rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 my-5">
          <div
            className={`h-2.5 rounded-full ${
              step >= 0 ? 'bg-[#002045]' : 'bg-[#d5e2e9]'
            }`}
          ></div>
          <div
            className={`h-2.5 rounded-full ${
              step >= 1 ? 'bg-[#002045]' : 'bg-[#d5e2e9]'
            }`}
          ></div>
          <div
            className={`h-2.5 rounded-full ${
              step >= 2 ? 'bg-[#002045]' : 'bg-[#d5e2e9]'
            }`}
          ></div>
        </div>

        {/* Step 1: Memory Warmup */}
        {step === 0 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#f0f3ff] p-4 rounded-xl border border-[#adc7f7]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#002045]">
                Part 1: Memory Recall
              </span>
              <h3 className="font-extrabold text-[20px] text-[#002045] mt-1">
                Which flower do you plant for morning puja rituals in your home garden?
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['Golden Marigolds (Genda)', 'Plastic cactus', 'Dried twigs'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    playGentleClick();
                    setDrill1Choice(opt);
                  }}
                  className={`p-4 rounded-xl text-[19px] font-bold text-left min-h-[60px] border-2 transition-all cursor-pointer ${
                    drill1Choice === opt
                      ? 'bg-[#002045] text-white border-[#002045]'
                      : 'bg-[#f9f9ff] text-[#121c2c] border-[#c4c6cf] hover:border-[#002045]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Attention & Discrimination */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#f0f3ff] p-4 rounded-xl border border-[#adc7f7]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#002045]">
                Part 2: Visual Attention Focus
              </span>
              <h3 className="font-extrabold text-[20px] text-[#002045] mt-1">
                Spot the symbol that represents peace and good health:
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: 'favorite', label: 'Heart (Health)' },
                { icon: 'block', label: 'Prohibition' },
                { icon: 'warning', label: 'Caution' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    playGentleClick();
                    setDrill2Choice(item.label);
                  }}
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center min-h-[90px] border-2 transition-all cursor-pointer ${
                    drill2Choice === item.label
                      ? 'bg-[#002045] text-white border-[#002045]'
                      : 'bg-[#f9f9ff] text-[#121c2c] border-[#c4c6cf] hover:border-[#002045]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[36px] mb-1">{item.icon}</span>
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Planning Executive Function */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#f0f3ff] p-4 rounded-xl border border-[#adc7f7]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#002045]">
                Part 3: Daily Planning & Hydration
              </span>
              <h3 className="font-extrabold text-[20px] text-[#002045] mt-1">
                How many fresh glasses of warm water or herbal tea do you aim for daily?
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['6 to 8 glasses spread gently through the day', '0 glasses', 'Only 1 sip'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    playGentleClick();
                    setDrill3Choice(opt);
                  }}
                  className={`p-4 rounded-xl text-[19px] font-bold text-left min-h-[60px] border-2 transition-all cursor-pointer ${
                    drill3Choice === opt
                      ? 'bg-[#002045] text-white border-[#002045]'
                      : 'bg-[#f9f9ff] text-[#121c2c] border-[#c4c6cf] hover:border-[#002045]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-7 pt-4 border-t border-[#c4c6cf] flex justify-between items-center">
          <button
            onClick={() => {
              if (step === 0) speakText('Which flower do you plant for morning puja rituals?');
              if (step === 1) speakText('Spot the symbol that represents peace and good health.');
              if (step === 2) speakText('How many fresh glasses of water or tea do you aim for daily?');
            }}
            className="text-[#002045] font-bold text-base flex items-center hover:bg-[#f0f3ff] px-3 py-2 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined mr-1.5 text-[22px]">volume_up</span>
            Read Step
          </button>

          {step < 2 ? (
            <button
              onClick={() => {
                playSuccessChime();
                setStep((s) => s + 1);
              }}
              disabled={(step === 0 && !drill1Choice) || (step === 1 && !drill2Choice)}
              className="bg-[#002045] hover:bg-[#1a365d] disabled:bg-gray-200 disabled:text-gray-400 text-white px-8 py-3.5 rounded-xl font-bold text-[19px] min-h-[56px] flex items-center cursor-pointer shadow-md"
            >
              <span>Next Drill</span>
              <span className="material-symbols-outlined ml-2 text-[22px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleFinishTraining}
              disabled={!drill3Choice}
              className="bg-[#002045] hover:bg-[#1a365d] disabled:bg-gray-200 disabled:text-gray-400 text-white px-8 py-3.5 rounded-xl font-bold text-[19px] min-h-[56px] flex items-center cursor-pointer shadow-md"
            >
              <span>Complete Daily Workout</span>
              <span className="material-symbols-outlined ml-2 text-[22px]">check_circle</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
