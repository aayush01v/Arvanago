
import React, { useMemo, useState } from 'react';
import { dailyLeaderboard, allTimeLeaderboard } from '../constants.ts';
import { LeaderboardEntry } from '../types.ts';
import Icon from './common/Icon.tsx';

const RankMedal: React.FC<{ rank: number }> = ({ rank }) => {
  const isTop = rank <= 3;
  const gradients = [
    'from-yellow-300 via-amber-200 to-yellow-500',
    'from-slate-200 via-slate-100 to-slate-400',
    'from-amber-500 via-orange-400 to-amber-600',
  ];

  const glow = ['shadow-yellow-300/50', 'shadow-slate-200/50', 'shadow-amber-400/40'][rank - 1] ?? '';

  if (isTop) {
    return (
      <div className={`badge-pulse relative inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br ${gradients[rank - 1]} text-slate-900 shadow-xl ${glow} border-2 border-white/50 ring-2 ring-white/20`}>
        <span className="font-black text-lg">{rank}</span>
        <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse-bright" />
      </div>
    );
  }

  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-slate-500 dark:text-slate-300">
      {rank}
    </div>
  );
};

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry }> = ({ entry }) => {
  const isTop = entry.rank <= 3;

  return (
    <div className={`group flex items-center p-4 rounded-2xl mb-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${isTop ? 'bg-white/60 dark:bg-slate-800/60 border border-brand-primary/20' : 'bg-white/40 dark:bg-slate-900/40 border border-white/10'}`}>
      <div className="flex-shrink-0 w-16 text-center">
        <RankMedal rank={entry.rank} />
      </div>

      <div className="flex items-center gap-4 flex-grow ml-4">
        <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-white dark:border-slate-700 shadow-md">
          <img src={entry.user.avatar} alt={entry.user.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex-grow">
          <p className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
            {entry.user.name}
            {isTop && <Icon name="sparkle" className="w-4 h-4 text-yellow-400" />}
          </p>
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">{entry.user.title ?? 'Learner'}</p>
        </div>
      </div>

      <div className="flex flex-col items-end pr-4">
        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
          {entry.points.toLocaleString()}
        </span>
        <span className="text-xs font-semibold text-slate-400">POINTS</span>
      </div>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'allTime'>('daily');

  const data = useMemo(() => (activeTab === 'daily' ? dailyLeaderboard : allTimeLeaderboard), [activeTab]);
  const spotlight = useMemo(() => data.slice(0, 3), [data]);
  const others = useMemo(() => data.slice(3), [data]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Leaderboard</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Celebrate the top learners making waves in the community.
        </p>

        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mx-auto mt-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'daily' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Daily Pulse
          </button>
          <button
            onClick={() => setActiveTab('allTime')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'allTime' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            All-Time Legends
          </button>
        </div>
      </div>

      {/* Top 3 Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end py-10">
        {/* Rank 2 */}
        <div className="md:order-1 order-2 transform hover:-translate-y-2 transition-transform duration-500">
          {spotlight[1] && (
            <div className="interactive-card neon-border relative flex flex-col items-center p-6 bg-white/80 dark:bg-slate-900/80 rounded-[32px] border border-white/50">
              <div className="absolute -top-6">
                <RankMedal rank={2} />
              </div>
              <div className="mt-8 mb-4 h-20 w-20 rounded-full p-1 bg-gradient-to-br from-slate-200 to-slate-400">
                <img src={spotlight[1].user.avatar} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900" alt="" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{spotlight[1].user.name}</h3>
              <p className="text-brand-primary font-extrabold text-2xl mt-1">{spotlight[1].points.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Rank 1 */}
        <div className="md:order-2 order-1 transform hover:-translate-y-2 transition-transform duration-500 -mt-10">
          {spotlight[0] && (
            <div className="interactive-card neon-border relative flex flex-col items-center p-8 bg-gradient-to-b from-brand-primary/10 to-transparent dark:from-brand-primary/20 rounded-[32px] border border-brand-primary/30 shadow-2xl shadow-brand-primary/20">
              <div className="absolute -top-8">
                <div className="animate-bounce">
                  <Icon name="crown" className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
                </div>
              </div>
              <div className="mt-6 mb-4 h-28 w-28 rounded-full p-1 bg-gradient-to-br from-yellow-300 to-amber-500 shadow-xl shadow-amber-500/30">
                <img src={spotlight[0].user.avatar} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900" alt="" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{spotlight[0].user.name}</h3>
              <p className="text-brand-primary font-black text-3xl mt-1">{spotlight[0].points.toLocaleString()}</p>
              <div className="mt-4 px-4 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider">
                Top Learner
              </div>
            </div>
          )}
        </div>

        {/* Rank 3 */}
        <div className="md:order-3 order-3 transform hover:-translate-y-2 transition-transform duration-500">
          {spotlight[2] && (
            <div className="interactive-card neon-border relative flex flex-col items-center p-6 bg-white/80 dark:bg-slate-900/80 rounded-[32px] border border-white/50">
              <div className="absolute -top-6">
                <RankMedal rank={3} />
              </div>
              <div className="mt-8 mb-4 h-20 w-20 rounded-full p-1 bg-gradient-to-br from-amber-600 to-amber-800">
                <img src={spotlight[2].user.avatar} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900" alt="" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{spotlight[2].user.name}</h3>
              <p className="text-brand-primary font-extrabold text-2xl mt-1">{spotlight[2].points.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* The Rest */}
      <div className="bg-white/40 dark:bg-slate-900/40 rounded-3xl p-6">
        {others.map(entry => (
          <LeaderboardRow key={entry.rank} entry={entry} />
        ))}
      </div>

    </div>
  );
};

export default Leaderboard;
