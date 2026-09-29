import React, { useState } from 'react';
import type { GameInfo, Category } from '../types';
import { playGentleClick } from '../utils/audio';

interface GamesViewProps {
  games: GameInfo[];
  onPlayGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string, currentFav: boolean) => void;
}

export const GamesView: React.FC<GamesViewProps> = ({
  games,
  onPlayGame,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories: string[] = ['All', 'Memory', 'Attention', 'Planning'];

  const filteredGames =
    selectedCategory === 'All'
      ? games
      : games.filter((g) => g.category === selectedCategory);

  const getLevelLabel = (level: number, maxLevel: number = 3) => {
    if (maxLevel > 3) {
      if (level <= 3) return 'Visuospatial Core';
      if (level <= 5) return 'Spatial Construction';
      if (level <= 7) return 'Working Memory & Audio';
      if (level <= 9) return 'Everyday Reasoning';
      return 'Executive ADL Mastery';
    }
    switch (level) {
      case 1:
        return 'Gentle Pace';
      case 2:
        return 'Moderate Pace';
      case 3:
        return 'Master Tier';
      default:
        return `Tier ${level}`;
    }
  };

  return (
    <main id="games-view-main" className="flex-1 p-4 sm:p-6 md:p-12 bg-[#030e21] text-white w-full min-w-0 max-w-full overflow-x-hidden box-border">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-white mb-2">
              Cognitive Games & Level Progression
            </h1>
            <p className="font-normal text-[18px] md:text-[20px] text-blue-200">
              Step through adaptive difficulty levels designed to strengthen cognitive reserve and retention.
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 bg-[#0c234a] px-4 py-2 rounded-2xl border border-amber-400/50 text-amber-200 shadow-md">
            <span className="material-symbols-outlined text-[24px] text-amber-400 filled-icon">
              military_tech
            </span>
            <div className="text-left">
              <p className="text-xs font-extrabold uppercase tracking-wide text-amber-300">Progression Rule</p>
              <p className="text-sm font-bold text-white">Score 70%+ accuracy to unlock next level</p>
            </div>
          </div>
        </div>
      </div>

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
              className={`px-5 py-3 rounded-full text-[17px] font-bold transition-all min-h-[48px] cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-400 ${
                isActive
                  ? 'bg-white text-[#002045] font-black shadow-md'
                  : 'bg-[#07152b] text-blue-200 hover:bg-blue-900/60 hover:text-white border border-blue-900/60'
              }`}
            >
              {cat === 'All' ? '🌟 All Exercises' : cat}
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGames.map((game) => {
          const currentLvl = game.level || 1;
          const maxLvl = game.maxLevel || 3;
          const xpCurrent = game.xp || 0;
          const xpTarget = game.xpToNextLevel || 100;
          const xpPercent = Math.min(100, Math.round((xpCurrent / xpTarget) * 100));
          const starCount = game.stars || currentLvl;

          return (
            <div
              key={game.id}
              id={`game-card-${game.id}`}
              className="bg-[#0b1d3a] p-6 sm:p-7 rounded-2xl border-2 border-blue-900/60 hover:border-sky-400 shadow-lg transition-all flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl text-white"
            >
              <div>
                {/* Top row: category badge, level badge & favorite */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-900/80 text-sky-200 border border-blue-700/60 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                      {game.category}
                    </span>
                    <span className="bg-blue-950 text-sky-300 border border-blue-800 font-extrabold px-3 py-1 rounded-full text-xs flex items-center shadow-xs">
                      <span className="material-symbols-outlined text-[15px] mr-1 text-amber-400 filled-icon">
                        star
                      </span>
                      Level {currentLvl}/{maxLvl} • {getLevelLabel(currentLvl, maxLvl)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playGentleClick();
                      onToggleFavorite(game.id, !game.isFavorite);
                    }}
                    title={game.isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}
                    aria-label="Toggle Favorite"
                    className="p-2 text-amber-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <span
                      className={`material-symbols-outlined text-[26px] ${
                        game.isFavorite ? 'filled-icon text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      star
                    </span>
                  </button>
                </div>

                {/* Title & Icon */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/70 text-sky-300 border border-blue-700/60 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-500 group-hover:text-[#002045] transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[32px]">{game.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[22px] text-white group-hover:text-sky-300 transition-colors">
                      {game.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <div className="flex text-amber-400">
                        {Array.from({ length: maxLvl }).map((_, i) => (
                          <span
                            key={i}
                            className={`material-symbols-outlined text-[18px] ${
                              i < starCount ? 'filled-icon text-amber-400' : 'text-slate-600'
                            }`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-blue-300 font-medium">
                        • High Score: {game.highScore} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[17px] leading-relaxed text-blue-200 my-3">
                  {game.description}
                </p>

                {/* Level Progression Progress Bar */}
                <div className="bg-[#07152b] p-3 rounded-xl border border-blue-900/60 mt-3">
                  <div className="flex justify-between items-center text-xs font-bold text-sky-200 mb-1.5">
                    <span className="flex items-center">
                      <span className="material-symbols-outlined text-[16px] mr-1 text-amber-400">bolt</span>
                      Level {currentLvl} Mastery Progress
                    </span>
                    <span>{currentLvl < maxLvl ? `${xpCurrent} / ${xpTarget} XP` : 'MAX LEVEL UNLOCKED'}</span>
                  </div>
                  <div className="w-full bg-blue-950 h-2.5 rounded-full overflow-hidden border border-blue-900/60">
                    <div
                      className="bg-sky-400 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${currentLvl >= maxLvl ? 100 : xpPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Play Button Row */}
              <div className="mt-5 pt-4 border-t border-blue-900/50 flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-400 flex items-center">
                  <span className="material-symbols-outlined text-[20px] mr-1 text-emerald-400">military_tech</span>
                  +{currentLvl * 25 + 20} pts reward
                </span>

                <button
                  onClick={() => {
                    playGentleClick();
                    onPlayGame(game.id);
                  }}
                  className="bg-white hover:bg-sky-50 active:bg-slate-200 text-[#002045] px-6 py-3 rounded-xl font-black text-[18px] flex items-center shadow-md cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-400 min-h-[52px]"
                >
                  <span>Play Level {currentLvl}</span>
                  <span className="material-symbols-outlined ml-1.5 text-[22px]">play_arrow</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};
