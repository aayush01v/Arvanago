
import React, { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dailyLeaderboard, allTimeLeaderboard } from '../constants.ts';
import { LeaderboardEntry, User } from '../types.ts';
import Icon from './common/Icon.tsx';
import { getLeaderboard } from '../services/firestoreService.ts';
import { SidebarLayoutContext } from './SidebarLayout.tsx';

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

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; isMe?: boolean }> = ({ entry, isMe }) => {
  const isTop = entry.rank <= 3;

  return (
    <div className={`group flex items-center p-3 sm:p-4 rounded-2xl mb-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${isMe
      ? 'bg-brand-primary/10 border-2 border-brand-primary'
      : isTop
        ? 'bg-white/60 dark:bg-slate-800/60 border border-brand-primary/20'
        : 'bg-white/40 dark:bg-slate-900/40 border border-white/10'
      }`}>
      <div className="flex-shrink-0 w-8 sm:w-16 text-center">
        <RankMedal rank={entry.rank} />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-grow ml-2 sm:ml-4 overflow-hidden">
        <div className="relative h-10 w-10 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-white dark:border-slate-700 shadow-md flex-shrink-0">
          <img src={entry.user.avatar} alt={entry.user.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-base sm:text-lg truncate ${isMe ? 'text-brand-primary' : 'text-slate-900 dark:text-white'}`}>
              {entry.user.name}
            </p>
            {isMe && <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
            {isTop && <Icon name="sparkle" className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />}
          </div>
          <p className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 truncate">{entry.user.title ?? 'Learner'}</p>
        </div>
      </div>

      <div className="flex flex-col items-end pl-2 sm:pr-4 flex-shrink-0">
        <span className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
          {entry.points.toLocaleString()}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-slate-400">POINTS</span>
      </div>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const { user } = useOutletContext<SidebarLayoutContext>();
  const [activeTab, setActiveTab] = useState<'daily' | 'allTime'>('allTime'); // Default to allTime for real data
  const [realData, setRealData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      if (activeTab === 'allTime') {
        try {
          const users = await getLeaderboard(50);
          if (users.length > 0) {
            const mapped = users.map((u, i) => ({
              rank: i + 1,
              user: { uid: u.uid, name: u.name, avatar: u.avatar, title: u.jobTitle },
              points: u.points
            }));
            setRealData(mapped);
          } else {
            // Fallback to constants if no data
            setRealData(allTimeLeaderboard);
          }
        } catch (err) {
          console.error(err);
          setRealData(allTimeLeaderboard);
        }
      } else {
        // Daily is still mocked for now
        setRealData(dailyLeaderboard);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [activeTab]);

  const spotlight = useMemo(() => realData.slice(0, 3), [realData]);
  const others = useMemo(() => realData.slice(3), [realData]);

  // Find current user rank
  const userRankEntry = useMemo(() => {
    if (!user) return null;
    return realData.find(e => e.user.uid === user.uid) || {
      rank: 999, // Fallback rank if not in list
      user: { uid: user.uid, name: user.name, avatar: user.avatar, title: user.jobTitle },
      points: user.points
    };
  }, [realData, user]);

  const isUserInTopView = userRankEntry && userRankEntry.rank <= 50; // Show "You" bar only if user is logged in
  const showStickyBar = user && !!userRankEntry;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in max-w-5xl mx-auto pb-32">
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

      {loading ? (
        <div className="flex justify-center py-20">
          <Icon name="spinner" className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          {/* Top 3 Spotlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end py-10">
            {/* Rank 2 */}
            <div className="md:order-1 order-2 relative transform hover:-translate-y-2 transition-transform duration-500 mt-8 md:mt-0">
              {spotlight[1] && (
                <>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <RankMedal rank={2} />
                  </div>
                  <div className="interactive-card neon-border relative flex flex-col items-center p-6 bg-white/80 dark:bg-slate-900/80 rounded-[32px] border border-white/50">
                    <div className="mt-8 mb-4 h-20 w-20 rounded-full p-1 bg-gradient-to-br from-slate-200 to-slate-400">
                      <img src={spotlight[1].user.avatar} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900" alt="" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{spotlight[1].user.name}</h3>
                    <p className="text-brand-primary font-extrabold text-2xl mt-1">{spotlight[1].points.toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>

            {/* Rank 1 */}
            <div className="md:order-2 order-1 relative transform hover:-translate-y-2 transition-transform duration-500 mt-10 md:-mt-10 mb-8 md:mb-0">
              {spotlight[0] && (
                <>
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="animate-bounce">
                      <Icon name="crown" className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="interactive-card neon-border relative flex flex-col items-center p-8 bg-gradient-to-b from-brand-primary/10 to-transparent dark:from-brand-primary/20 rounded-[32px] border border-brand-primary/30 shadow-2xl shadow-brand-primary/20">
                    {/* Spacer for crown */}
                    <div className="mt-4 mb-4 h-28 w-28 rounded-full p-1 bg-gradient-to-br from-yellow-300 to-amber-500 shadow-xl shadow-amber-500/30">
                      <img src={spotlight[0].user.avatar} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900" alt="" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{spotlight[0].user.name}</h3>
                    <p className="text-brand-primary font-black text-3xl mt-1">{spotlight[0].points.toLocaleString()}</p>
                    <div className="mt-4 px-4 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider">
                      Top Learner
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Rank 3 */}
            <div className="md:order-3 order-3 relative transform hover:-translate-y-2 transition-transform duration-500 mt-8 md:mt-0">
              {spotlight[2] && (
                <>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <RankMedal rank={3} />
                  </div>
                  <div className="interactive-card neon-border relative flex flex-col items-center p-6 bg-white/80 dark:bg-slate-900/80 rounded-[32px] border border-white/50">
                    <div className="mt-8 mb-4 h-20 w-20 rounded-full p-1 bg-gradient-to-br from-amber-600 to-amber-800">
                      <img src={spotlight[2].user.avatar} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900" alt="" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{spotlight[2].user.name}</h3>
                    <p className="text-brand-primary font-extrabold text-2xl mt-1">{spotlight[2].points.toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* The Rest */}
          <div className="bg-white/40 dark:bg-slate-900/40 rounded-3xl p-6">
            {others.map(entry => (
              <LeaderboardRow key={entry.rank} entry={entry} isMe={user && entry.user.uid === user.uid} />
            ))}
          </div>
        </>
      )}

      {/* Sticky User Rank Bar */}
      {showStickyBar && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-40 animate-slide-up-fade">
          <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 text-center font-black text-xl">#{userRankEntry.rank}</div>
              <div className="flex items-center gap-3">
                <img src={userRankEntry.user.avatar} className="w-10 h-10 rounded-full border-2 border-white/30" />
                <div>
                  <div className="font-bold">You</div>
                  <div className="text-xs opacity-70">{userRankEntry.points.toLocaleString()} Points</div>
                </div>
              </div>
            </div>
            <div className="text-sm font-bold opacity-80">
              Keep pushing! 🚀
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leaderboard;
