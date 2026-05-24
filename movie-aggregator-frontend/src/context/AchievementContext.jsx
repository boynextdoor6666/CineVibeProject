import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import AchievementToast from '../components/AchievementToast';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from './AuthContext';

const AchievementContext = createContext(null);

const getAchievementId = (item) => item?.achievement?.id ?? item?.id ?? null;

export const AchievementProvider = ({ children }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const knownAchievementsRef = useRef(new Set());

  const playSound = () => {
    try {
      // Steam-like achievement sound
      const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch (e) {
      console.error('Audio error', e);
    }
  };

  const showAchievement = useCallback((achievement) => {
    setQueue((prev) => [...prev, achievement]);
    if (achievement.id) {
      knownAchievementsRef.current.add(achievement.id);
    }
  }, []);

  // Poll for achievements
  useEffect(() => {
    if (!user) {
      knownAchievementsRef.current = new Set();
      return;
    }

    const fetchAchievements = async () => {
      try {
        const res = await axios.get('/api/users/me/achievements');
        const achievements = Array.isArray(res.data) ? res.data : [];
        
        // If first load, just populate known set without notifying
        if (knownAchievementsRef.current.size === 0) {
          const ids = new Set(
            achievements
              .map(getAchievementId)
              .filter((id) => id !== null)
          );
          knownAchievementsRef.current = ids;
          return;
        }

        // Check for new ones
        achievements.forEach((ua) => {
          const achievementId = getAchievementId(ua);
          const achievement = ua?.achievement ?? ua;

          if (achievementId === null || !achievement) {
            return;
          }

          if (!knownAchievementsRef.current.has(achievementId)) {
            // New achievement!
            showAchievement(achievement);
            knownAchievementsRef.current.add(achievementId);
          }
        });
      } catch (err) {
        console.error('Failed to fetch achievements', err);
      }
    };

    // Initial fetch
    fetchAchievements();

    // Poll every 15 seconds
    const interval = setInterval(fetchAchievements, 15000);
    return () => clearInterval(interval);
  }, [user, showAchievement]);

  // Process queue
  useEffect(() => {
    if (current || queue.length === 0) return;

    const next = queue[0];
    setCurrent(next);
    setQueue((prev) => prev.slice(1));
    playSound();

    const timer = setTimeout(() => {
      setCurrent(null);
    }, 5500); // Slightly longer than the toast duration

    return () => clearTimeout(timer);
  }, [queue, current]);

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      <AnimatePresence>
        {current && (
          <AchievementToast 
            key={current.id || Date.now()} 
            achievement={current} 
            onClose={() => setCurrent(null)} 
          />
        )}
      </AnimatePresence>
    </AchievementContext.Provider>
  );
};

export const useAchievement = () => useContext(AchievementContext);
