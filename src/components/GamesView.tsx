import React, { useState } from 'react';
import type { GameInfo } from '../types';
import { playGentleClick } from '../utils/audio';
import { AILevelGeneratorModal } from './AILevelGeneratorModal';
import { AIGeneratedLevel } from '../services/aiLevelGeneratorService';

interface GamesViewProps {
  games: GameInfo[];
  onPlayGame: (gameId: string, levelOverride?: number, customLevelData?: any) => void;
  onToggleFavorite: (gameId: string, currentFav: boolean) => void;
}

export const GamesView: React.FC<GamesViewProps> = ({
  games,
  onPlayGame,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState<boolean>(false);
  const [selectedGameForLevelPicker, setSelectedGameForLevelPicker] = useState<GameInfo | null>(null);
  const [showResearchDrawer, setShowResearchDrawer] = useState<boolean>(false);

  const categories: string[] = ['All', 'Memory', 'Attention', 'Planning', 'Spatial', 'Executive'];

  const filteredGames =
    selectedCategory === 'All'
      ? games
      : games.filter((g) => g.category === selectedCategory);

  const getLevelLabel = (level: number, maxLevel: number = 10) => {
    if (level === 1) return 'Tier 1: Gentle Pace (MCI Focus)';
    if (level === 2) return 'Tier 2: Core Memory Active';
    if (level === 3) return 'Tier 3: Moderate Challenge';
    if (level === 4) return 'Tier 4: Working Memory Dual';
    if (level === 5) return 'Tier 5: Executive Processing';
    if (level === 6) return 'Tier 6: Inhibitory Control';
    if (level === 7) return 'Tier 7: Spatial Matrix';
    if (level === 8) return 'Tier 8: Complex Sequence';
    if (level === 9) return 'Tier 9: High Cognitive Load';
    return 'Tier 10: Master Reserve Tier';
  };

  const handlePlayAIGeneratedLevel = (generatedLevel: AIGeneratedLevel) => {
    onPlayGame(generatedLevel.gameId, generatedLevel.difficultyTier, generatedLevel.levelData);
  };

  return (
    <main
      id="games-view-main"
      className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 bg-white dark:bg-[#0a1128] text-[#002045] dark:text-slate-100 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden box-border transition-colors"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                Peer-Reviewed Clinical Protocol
              </span>
              <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-blue-300 dark:border-blue-800">
                Levels 1 - 10
              </span>
            </div>
            <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] dark:text-white mb-2">
              Dementia Cognitive Exercises &amp; Level Engine
            </h1>
            <p className="font-normal text-[17px] md:text-[19px] text-slate-600 dark:text-slate-300 max-w-3xl">
              Scientifically engineered working memory, executive inhibition, spatial navigation, and reminiscence games with dynamic AI level generation and errorless learning.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                playGentleClick();
                setIsAIGeneratorOpen(true);
              }}
              className="bg-[#FF6321] hover:bg-[#e05215] text-white font-extrabold px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 min-h-[52px]"
            >
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
              <span>AI Automatic Level Generator</span>
            </button>

            <button
              onClick={() => {
                playGentleClick();
                setShowResearchDrawer((prev) => !prev);
              }}
              className="bg-slate-100 dark:bg-[#111e38] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#1e3a6a] hover:bg-slate-200 font-extrabold px-4 py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer min-h-[52px]"
            >
              <span className="material-symbols-outlined text-[22px]">menu_book</span>
              <span>Research Grounds</span>
            </button>
          </div>
        </div>
      </div>

      {/* Research Paper Drawer */}
      {showResearchDrawer && (
        <div className="mb-8 p-6 bg-amber-50/90 dark:bg-[#111d38] border-2 border-amber-300 dark:border-amber-800/60 rounded-3xl animate-fadeIn space-y-4 text-amber-950 dark:text-amber-100">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-xl flex items-center">
              <span className="material-symbols-outlined text-[26px] mr-2 text-amber-600">biomedical</span>
              Neuroscientific Research Basis for Dementia Cognitive Games
            </h3>
            <button
              onClick={() => setShowResearchDrawer(false)}
              className="p-1.5 text-amber-800 dark:text-amber-300 hover:bg-amber-200 rounded-full"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <p className="text-sm leading-relaxed">
            Clinical studies in <em>The Lancet Commission on Dementia Prevention</em>, <em>PNAS (Jaeggi et al.)</em>, and <em>Neuropsychological Rehabilitation</em> demonstrate that structured, errorless cognitive training delays neurodegenerative decline by strengthening synaptic density and cognitive reserve:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="p-3.5 bg-white dark:bg-[#0a1128] rounded-2xl border border-amber-200 dark:border-amber-900">
              <p className="font-extrabold text-sm text-[#002045] dark:text-blue-300 mb-1">
                🧠 Dual N-Back Working Memory
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Simultaneous visual spatial + auditory letter recall exercises prefrontal cortex working memory circuits, expanding fluid cognitive capacity.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#0a1128] rounded-2xl border border-amber-200 dark:border-amber-900">
              <p className="font-extrabold text-sm text-[#002045] dark:text-blue-300 mb-1">
                🎨 Stroop Executive Inhibition
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Incongruent color-word stimulus matching trains selective attention and suppresses wandering impulses in early Alzheimer's.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#0a1128] rounded-2xl border border-amber-200 dark:border-amber-900">
              <p className="font-extrabold text-sm text-[#002045] dark:text-blue-300 mb-1">
                🧭 Parieto-Hippocampal Spatial Grid
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Matrix pattern recall (Corsi Tapping) reactivates entorhinal grid cells responsible for neighborhood spatial navigation.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#0a1128] rounded-2xl border border-amber-200 dark:border-amber-900">
              <p className="font-extrabold text-sm text-[#002045] dark:text-blue-300 mb-1">
                🌸 Paired-Associate Reminiscence
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Combining cultural association cues with errorless learning hints protects self-worth and preserves autobiographical memory.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                playGentleClick();
                setSelectedCategory(cat);
              }}
              className={`px-5 py-3 rounded-full text-[16px] font-extrabold transition-all min-h-[48px] cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#002045] dark:focus:ring-blue-500 ${
                isActive
                  ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#111e38] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2d52] border border-slate-200 dark:border-[#1e3a6a]'
              }`}
            >
              {cat === 'All' ? '🌟 All Clinical Exercises' : cat}
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGames.map((game) => {
          const currentLvl = game.level || 1;
          const maxLvl = game.maxLevel || 10;

          return (
            <div
              key={game.id}
              id={`game-card-${game.id}`}
              className="bg-white dark:bg-[#111e38] p-6 sm:p-7 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] hover:border-[#002045] dark:hover:border-blue-400 shadow-xs transition-all flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                {/* Top row: category badge, level badge & favorite */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-sky-50 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-sky-200 dark:border-sky-800">
                      {game.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        playGentleClick();
                        setSelectedGameForLevelPicker(game);
                      }}
                      className="bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] text-white font-extrabold px-3.5 py-1 rounded-full text-xs flex items-center shadow-xs cursor-pointer group-hover:scale-105 transition-all"
                      title="Click to select specific level 1-10"
                    >
                      <span className="material-symbols-outlined text-[15px] mr-1 text-amber-300 filled-icon">
                        star
                      </span>
                      <span>Level {currentLvl} of {maxLvl}</span>
                      <span className="material-symbols-outlined text-[14px] ml-1">expand_more</span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playGentleClick();
                      onToggleFavorite(game.id, !game.isFavorite);
                    }}
                    title={game.isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}
                    aria-label="Toggle Favorite"
                    className="p-2 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950/60 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <span
                      className={`material-symbols-outlined text-[26px] ${
                        game.isFavorite ? 'filled-icon text-amber-500' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      star
                    </span>
                  </button>
                </div>

                {/* Title & Icon */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-blue-900/50 text-[#002045] dark:text-blue-200 border border-sky-100 dark:border-blue-800 flex items-center justify-center flex-shrink-0 group-hover:bg-[#002045] dark:group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[32px]">{game.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[22px] text-[#002045] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {getLevelLabel(currentLvl, maxLvl)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[16px] leading-relaxed text-slate-600 dark:text-slate-300 my-3">
                  {game.description}
                </p>

                {/* Quick Level Selector Pills */}
                <div className="bg-slate-50 dark:bg-[#0f1d38] p-3 rounded-2xl border border-slate-200 dark:border-[#1e3a6a] mt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[#002045] dark:text-slate-200">
                    <span>Select Level Tier (1 - 10)</span>
                    <button
                      onClick={() => setSelectedGameForLevelPicker(game)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View All 10 Levels
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const lvlNum = i + 1;
                      const isCurrent = lvlNum === currentLvl;
                      return (
                        <button
                          key={lvlNum}
                          onClick={() => onPlayGame(game.id, lvlNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-[#FF6321] text-white shadow-sm'
                              : 'bg-white dark:bg-[#1a2d52] text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-[#2a457a]'
                          }`}
                        >
                          {lvlNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Play Button Row */}
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#1e3a6a] flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
                  <span className="material-symbols-outlined text-[20px] mr-1 text-emerald-600 dark:text-emerald-400">
                    military_tech
                  </span>
                  +{currentLvl * 25 + 20} pts reward
                </span>

                <button
                  onClick={() => {
                    playGentleClick();
                    onPlayGame(game.id, currentLvl);
                  }}
                  className="bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-500 active:scale-95 text-white px-6 py-3 rounded-2xl font-extrabold text-[18px] flex items-center shadow-sm cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#002045] dark:focus:ring-blue-500 min-h-[52px]"
                >
                  <span>Play Level {currentLvl}</span>
                  <span className="material-symbols-outlined ml-1.5 text-[22px]">play_arrow</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Automatic Level Generator Modal */}
      <AILevelGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onPlayGeneratedLevel={handlePlayAIGeneratedLevel}
      />

      {/* Level Selector Modal for Specific Game */}
      {selectedGameForLevelPicker && (
        <div
          className="fixed inset-0 z-50 bg-[#001026]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedGameForLevelPicker(null)}
        >
          <div
            className="bg-white dark:bg-[#0f1d38] rounded-3xl w-full max-w-xl p-6 shadow-2xl border-2 border-slate-200 dark:border-[#1e3a6a] text-[#002045] dark:text-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#002045] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    {selectedGameForLevelPicker.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">{selectedGameForLevelPicker.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select difficulty level 1 through 10</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGameForLevelPicker(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const lvlNum = i + 1;
                const isCurrent = lvlNum === selectedGameForLevelPicker.level;
                return (
                  <button
                    key={lvlNum}
                    onClick={() => {
                      playGentleClick();
                      onPlayGame(selectedGameForLevelPicker.id, lvlNum);
                      setSelectedGameForLevelPicker(null);
                    }}
                    className={`p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-[#002045] text-white border-[#002045]'
                        : 'bg-slate-50 dark:bg-[#111e38] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#1e3a6a] hover:border-[#002045]'
                    }`}
                  >
                    <div className="flex justify-between font-extrabold text-sm mb-1">
                      <span>Level {lvlNum}</span>
                      {isCurrent && <span className="text-amber-300 text-xs">Current</span>}
                    </div>
                    <p className={`text-xs ${isCurrent ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      {getLevelLabel(lvlNum, 10)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedGameForLevelPicker(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 font-extrabold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
