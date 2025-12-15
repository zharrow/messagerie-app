import { useState, useEffect } from 'react';
import { userApi } from '@/services/api';
import type { User } from '@/types/chat';

export const useUserCache = (currentUser?: User | null) => {
  const [usersCache, setUsersCache] = useState<Map<number, User>>(new Map());
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsersCache = async () => {
      try {
        const data = await userApi.listUsers();
        const cache = new Map<number, User>();
        data.forEach((u: User) => cache.set(u.id, u));

        // Add current user to cache if provided and not already present
        if (currentUser && !cache.has(currentUser.id)) {
          console.log('[UserCache] Adding current user to cache:', currentUser);
          cache.set(currentUser.id, currentUser);
        }

        console.log('[UserCache] Cache loaded. Size:', cache.size, 'Users:', Array.from(cache.keys()));
        setUsersCache(cache);
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users cache:', error);
      }
    };

    // Load cache immediately on mount, don't wait for currentUser
    loadUsersCache();
  }, [currentUser]);

  // Update cache when currentUser changes (to ensure name is always up to date)
  useEffect(() => {
    if (currentUser) {
      setUsersCache((prev: Map<number, User>) => {
        const newCache = new Map(prev);
        newCache.set(currentUser.id, currentUser);
        console.log('[UserCache] Updated current user in cache:', currentUser);
        return newCache;
      });
    }
  }, [currentUser]);

  const getUserDisplayName = (userId: number): string => {
    const cachedUser = usersCache.get(userId);
    console.log('[UserCache] getUserDisplayName for userId:', userId, 'Found:', !!cachedUser, 'Cache size:', usersCache.size);
    if (cachedUser) {
      console.log('[UserCache] Returning:', `${cachedUser.first_name} ${cachedUser.last_name}`);
      return `${cachedUser.first_name} ${cachedUser.last_name}`;
    }
    console.log('[UserCache] User not in cache, returning fallback');
    return `Utilisateur ${userId}`;
  };

  const getUserInitials = (userId: number): string => {
    const cachedUser = usersCache.get(userId);
    if (cachedUser) {
      return `${cachedUser.first_name?.[0] || ''}${cachedUser.last_name?.[0] || ''}`;
    }
    return 'U';
  };

  return {
    usersCache,
    users,
    setUsers,
    getUserDisplayName,
    getUserInitials,
  };
};
