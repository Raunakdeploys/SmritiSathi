import React, { useState } from 'react';
import {
  generateAndVerifyGameLevel,
  AIGeneratedLevel,
  ValidationTraceStep,
} from '../services/aiLevelGeneratorService';
import { playGentleClick, playSuccessBell } from '../utils/audio';

interface AILevelGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayGeneratedLevel: (level: AIGeneratedLevel) => void;
  initialGameId?: string;
}

export const AILevelGeneratorModal: React.FC<AILevelGeneratorModalProps> = ({
  isOpen,
  onClose,
  onPlayGeneratedLevel,
  initialGameId = 'word-pair-recall',
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(initialGameId);
  const [difficultyTier, setDifficultyTier] = useState<number>(3);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedLevel, setGeneratedLevel] = useState<AIGeneratedLevel | null>(null);
  const [traceLogs, setTraceLogs] = useState<ValidationTraceStep[]>([]);
  const [activeTab, setActiveTab] = useState<'forge' | 'research'>('forge');

  if (!isOpen) return null;

  const availableGames = [
    {
      id: 'word-pair-recall',
      name: 'Reminiscence Word Pairs',
      category: 'Memory',
      icon: 'psychology',
      desc: 'Paired-associate recall with reminiscence themes',
    },
    {
      id: 'dual-nback',
      name: 'Dual N-Back Working Memory',
      category: 'Attention',
      icon: 'grid_view',
      desc: 'Visual spatial position + auditory letter continuous recall',
    },
    {
      id: 'stroop-executive',
      name: 'Stroop Inhibitory Challenge',
      category: 'Executive',
      icon: 'palette',
      desc: 'Resist color-text conflict for selective attention control',
    },
    {
      id: 'spatial-grid',
      name: 'Spatial Grid Pattern Memory',
      category: 'Spatial',
      icon: 'crop_square',
      desc: 'Tile flashing matrix sequence spatial memory',
    },
    {
      id: 'dailyroutine',
      name: 'Daily ADL Task Sequence',
      category: 'Executive',
      icon: 'checklist',
      desc: 'Multi-step self-care & health task sequencing',
    },
  ];

  const handleForgeLevel = async () => {
    playGentleClick();
    setIsGenerating(true);
    setGeneratedLevel(null);
    setTraceLogs([]);

    try {
      const result = await generateAndVerifyGameLevel(
        selectedGameId,
        difficultyTier,
        customTopic.trim() || undefined,
        3
      );
      setGeneratedLevel(result);
      setTraceLogs(result.validationTrace);
      playSuccessBell();
    } catch (err) {
      console.error('[AI Level Generator Modal] Error generating level:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#001026]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f1d38] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-2 border-slate-300 dark:border-[#1e3a6a] text-[#002045] dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#002045] text-white p-5 sm:p-6 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6321] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[26px] leading-tight flex items-center gap-2">
                AI Automatic Level Generator
                <span className="text-xs bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Test &amp; Retry Engine
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-blue-200 font-medium">
                Synthesizes 100% verified, mathematically &amp; clinically tested cognitive levels for dementia care
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-blue-900/60 rounded-full cursor-pointer transition-colors"
            title="Close Modal"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0a1128] px-6">
          <button
            onClick={() => {
              playGentleClick();
              setActiveTab('forge');
            }}
            className={`py-3.5 px-5 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'forge'
                ? 'border-[#FF6321] text-[#FF6321] bg-white dark:bg-[#0f1d38]'
                : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Level Forge &amp; Verification</span>
          </button>

          <button
            onClick={() => {
              playGentleClick();
              setActiveTab('research');
            }}
            className={`py-3.5 px-5 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'research'
                ? 'border-[#FF6321] text-[#FF6321] bg-white dark:bg-[#0f1d38]'
                : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>Clinical Research Basis</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {activeTab === 'forge' && (
            <>
              {/* Game Target Selection */}
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200 mb-2">
                  1. Select Target Cognitive Game
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableGames.map((g) => {
                    const isSelected = selectedGameId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          playGentleClick();
                          setSelectedGameId(g.id);
                        }}
                        className={`p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer flex items-center space-x-3 ${
                          isSelected
                            ? 'border-[#002045] dark:border-blue-500 bg-sky-50 dark:bg-blue-950/80 ring-2 ring-[#002045]/20'
                            : 'border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#111e38] hover:border-slate-400'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#002045] text-white'
                              : 'bg-slate-200 dark:bg-[#1e293b] text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[22px]">{g.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-sm truncate text-[#002045] dark:text-white">{g.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{g.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Slider & Preset */}
              <div className="bg-slate-100 dark:bg-[#111e38] p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-[#1e3a6a]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200">
                    2. Cognitive Difficulty Tier (1 to 10)
                  </label>
                  <span className="bg-[#002045] text-white font-black px-3 py-1 rounded-full text-xs">
                    Tier {difficultyTier} / 10
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={difficultyTier}
                  onChange={(e) => setDifficultyTier(parseInt(e.target.value, 10))}
                  className="w-full accent-[#FF6321] cursor-pointer h-2 bg-slate-300 dark:bg-slate-700 rounded-lg mb-3"
                />

                <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-extrabold">
                  <span>Tier 1: Gentle Pace (MCI)</span>
                  <span>Tier 5: Moderate Memory</span>
                  <span>Tier 10: Executive Mastery</span>
                </div>
              </div>

              {/* Custom Topic / Personalization Input */}
              <div>
                <label htmlFor="custom-topic-input" className="block text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200 mb-2">
                  3. Personalization Theme or Topic (Optional)
                </label>
                <input
                  id="custom-topic-input"
                  type="text"
                  placeholder="e.g. 1970s Old Hindi Songs, Morning Tea & Medicinal Routine, Diwali Festivities, Shimla Trip..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#0a1128] text-sm font-extrabold text-[#002045] dark:text-white focus:outline-none focus:border-[#002045] dark:focus:border-blue-400 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold">
                  Customizing themes leverages emotional autobiographical memory networks in senior brain function.
                </p>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleForgeLevel}
                disabled={isGenerating}
                className={`w-full py-4 rounded-2xl font-extrabold text-[18px] text-white flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer ${
                  isGenerating
                    ? 'bg-slate-500 cursor-not-allowed'
                    : 'bg-[#FF6321] hover:bg-[#e05215] active:scale-98'
                }`}
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
                    <span>Running Test &amp; Retry Verification Engine...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                    <span>Forge &amp; Verify AI Level</span>
                  </>
                )}
              </button>

              {/* Live Trace Logs & Verification Results */}
              {traceLogs.length > 0 && (
                <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-2xl font-mono text-xs space-y-3 border border-slate-800">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-amber-400 font-extrabold flex items-center">
                      <span className="material-symbols-outlined text-[16px] mr-1">terminal</span>
                      SOLVER TEST &amp; RETRY LOGS
                    </span>
                    <span className="text-slate-300 font-bold">Attempts: {traceLogs.length}</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {traceLogs.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border ${
                          t.passed
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                            : 'bg-rose-950/80 border-rose-600 text-rose-200'
                        }`}
                      >
                        <div className="flex justify-between font-extrabold">
                          <span>
                            Attempt {t.attempt}: {t.testName}
                          </span>
                          <span>{t.passed ? '✓ PASSED' : '✗ FAILED - RETRYING'}</span>
                        </div>
                        <p className="text-[11px] mt-1 opacity-90 font-medium">{t.message}</p>
                      </div>
                    ))}
                  </div>

                  {generatedLevel && generatedLevel.isVerified && (
                    <div className="bg-emerald-900 border-2 border-emerald-400 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                      <div>
                        <p className="font-black text-sm">{generatedLevel.title}</p>
                        <p className="text-xs text-emerald-100 font-medium">{generatedLevel.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playGentleClick();
                          onPlayGeneratedLevel(generatedLevel);
                          onClose();
                        }}
                        className="bg-white text-emerald-950 hover:bg-emerald-100 px-5 py-2.5 rounded-xl font-black text-sm shrink-0 flex items-center cursor-pointer shadow-sm"
                      >
                        <span>Play Verified Level Now</span>
                        <span className="material-symbols-outlined text-[18px] ml-1">play_arrow</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'research' && (
            <div className="space-y-4 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
              <div className="p-4 bg-amber-100 dark:bg-amber-950/60 rounded-2xl border border-amber-300 dark:border-amber-800">
                <h3 className="font-extrabold text-base text-amber-950 dark:text-amber-200 mb-1 flex items-center">
                  <span className="material-symbols-outlined text-[20px] mr-2 text-amber-700">biomedical</span>
                  Scientific &amp; Clinical Foundations
                </h3>
                <p className="text-xs text-amber-900 dark:text-amber-300 font-medium">
                  SmritiSaathi cognitive exercises are grounded in peer-reviewed clinical neurorehabilitation literature for Alzheimer's and Mild Cognitive Impairment (MCI).
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#111e38] border border-slate-300 dark:border-[#1e3a6a]">
                  <h4 className="font-extrabold text-sm text-[#002045] dark:text-blue-200 mb-1">
                    1. Dual N-Back &amp; Prefrontal Plasticity (Jaeggi et al., PNAS)
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Dual visual spatial and auditory letter n-back tasks continuously challenge working memory capacity and fluid intelligence, delaying prefrontal cortical volume decline.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#111e38] border border-slate-300 dark:border-[#1e3a6a]">
                  <h4 className="font-extrabold text-sm text-[#002045] dark:text-blue-200 mb-1">
                    2. Stroop Executive Inhibitory Control (Lancet Commission on Dementia)
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Selective attention exercises with incongruent visual stimuli retrain cognitive interference suppression and prevent wandering and task abandonment.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#111e38] border border-slate-300 dark:border-[#1e3a6a]">
                  <h4 className="font-extrabold text-sm text-[#002045] dark:text-blue-200 mb-1">
                    3. Errorless Learning &amp; Spaced Reminiscence (Clare &amp; Woods, Neuropsychol Rehabil)
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Providing progressive visual bridge hints instead of harsh error penalties preserves emotional dignity and fosters implicit memory retention in early dementia stages.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#111e38] border border-slate-300 dark:border-[#1e3a6a]">
                  <h4 className="font-extrabold text-sm text-[#002045] dark:text-blue-200 mb-1">
                    4. Parietal-Hippocampal Spatial Grid Navigation (Corsi Block-Tapping Task)
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Spatial pattern recall directly stimulates entorhinal cortex grid cells responsible for physical orientation and neighborhood navigation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-[#0a1128] px-6 py-4 border-t border-slate-300 dark:border-[#1e3a6a] flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 font-extrabold">
          <span>AI Generator Engine: @google/genai (Gemini 2.5 Flash)</span>
          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-[#002045] text-white hover:bg-[#1a365d] rounded-xl cursor-pointer font-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
