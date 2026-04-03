import React, { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dailyLeaderboard, weeklyLeaderboard, allTimeLeaderboard } from '../constants.ts';
import { LeaderboardEntry, User } from '../types.ts';
import Icon from './common/Icon.tsx';
import { getLeaderboard } from '../services/firestoreService.ts';
import { SidebarLayoutContext } from './SidebarLayout.tsx';
import { motion, AnimatePresence } from 'framer-motion';

const RankMedal: React.FC<{ rank: number }> = React.memo(({ rank }) => {
  if (rank <= 3) {
    return (
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm">
        #{rank}
      </div>
    );
  }

  return (
    <div className="inline-flex min-w-[2rem] w-auto px-2 py-1 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300 text-sm">
      {rank}
    </div>
  );
});

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; isMe?: boolean; index: number }> = React.memo(({ entry, isMe, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-2 sm:gap-0 p-3 sm:p-4 rounded-2xl border transition-all ${isMe
        ? 'bg-brand-primary/10 border-brand-primary/40'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
        }`}
    >
      <div className="flex-shrink-0 w-10 sm:w-16 text-center flex justify-center">
        <RankMedal rank={entry.rank} />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-grow ml-1 sm:ml-4 overflow-hidden">
        <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <img src={entry.user.avatar} loading="lazy" decoding="async" alt={entry.user.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-base truncate ${isMe ? 'text-brand-primary' : 'text-slate-900 dark:text-white'}`}>
              {entry.user.name}
            </p>
            {isMe && <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded-full font-semibold">YOU</span>}
          </div>
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400 truncate">{entry.user.title ?? 'Learner'}</p>
        </div>
      </div>

      <div className="flex flex-col items-end pl-2 sm:pl-4 sm:pr-2 flex-shrink-0">
        <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          {entry.points.toLocaleString()}
        </span>
        <span className="text-[10px] sm:text-xs font-medium text-slate-400">POINTS</span>
      </div>
    </motion.div>
  );
});

const Leaderboard: React.FC = () => {
  const { user } = useOutletContext<SidebarLayoutContext>();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'allTime'>('allTime'); // Default to allTime for real data
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
            setRealData(allTimeLeaderboard);
          }
        } catch (err) {
          console.error(err);
          setRealData(allTimeLeaderboard);
        }
      } else if (activeTab === 'daily') {
        // Today is still mocked for now
        setRealData(dailyLeaderboard);
      } else {
        // 7-day board is still mocked for now
        setRealData(weeklyLeaderboard);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [activeTab]);

  const topThree = useMemo(() => realData.slice(0, 3), [realData]);
  const others = useMemo(() => realData.slice(3), [realData]);

  const userRankEntry = useMemo(() => {
    if (!user) return null;
    return realData.find(e => e.user.uid === user.uid) || {
      rank: 999,
      user: { uid: user.uid, name: user.name, avatar: user.avatar, title: user.jobTitle },
      points: user.points
    };
  }, [realData, user]);

  const showStickyBar = user && !!userRankEntry;

  return (
    <div className="w-full rhythm-stack-lg animate-fade-in pb-24 sm:pb-28">
      <div className="text-center rhythm-stack-sm">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          See your standing first, then review the top performers.
        </p>

        <div className="flex w-full sm:inline-flex sm:w-auto items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mx-auto mt-2 max-w-xl">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'daily' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'weekly' ? 'bg-slate-900 dark:bg-slate-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setActiveTab('allTime')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'allTime' ? 'bg-brand-primary text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            All-Time
          </button>
        </div>
      </div>

      {userRankEntry && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 rhythm-stack-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Your rank context</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900 dark:text-white">#{userRankEntry.rank}</span>
              <span className="text-sm text-slate-600 dark:text-slate-300">{userRankEntry.points.toLocaleString()} points</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Top {Math.min(100, Math.max(1, Math.round((userRankEntry.rank / Math.max(1, realData.length || 1)) * 100)))}% of this board</p>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Icon name="spinner" className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-6 rhythm-stack-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top performers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topThree.map((entry) => (
                <div key={entry.rank} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <RankMedal rank={entry.rank} />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{entry.points.toLocaleString()} pts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={entry.user.avatar} loading="lazy" decoding="async" className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{entry.user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{entry.user.title || 'Learner'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            {others.map((entry, idx) => (
              <LeaderboardRow key={entry.rank} entry={entry} isMe={user && entry.user.uid === user.uid} index={idx + 4} />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 inset-x-0 mx-auto w-full max-w-xl px-4 z-50 pointer-events-none"
          >
            <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 p-4 rounded-2xl shadow-xl border border-white/20 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-4">
                <div className="min-w-[3rem] px-2 text-center font-black text-xl text-brand-primary">#{userRankEntry.rank}</div>
                <div className="flex items-center gap-3">
                  <img src={userRankEntry.user.avatar} className="w-10 h-10 rounded-full border-2 border-white/30" alt="You" />
                  <div>
                    <div className="font-semibold">You</div>
                    <div className="text-xs opacity-70">{userRankEntry.points.toLocaleString()} Points</div>
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold opacity-80">Keep pushing</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leaderboard;
