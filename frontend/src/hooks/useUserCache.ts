import { useState, useEffect } from 'react';
import { userApi } from '@/services/api';
import type { User } from '@/types/chat';

export const useUserCache = () => {
  const [usersCache, setUsersCache] = useState<Map<number, User>>(new Map());
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsersCache = async () => {
      try {
        const data = await userApi.listUsers();
        const cache = new Map<number, User>();
        data.forEach((u: User) => cache.set(u.id, u));
        setUsersCache(cache);
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users cache:', error);
      }
    };

    loadUsersCache();
  }, []);

  const getUserDisplayName = (userId: number): string => {
    const cachedUser = usersCache.get(userId);
    if (cachedUser) {
      return `${cachedUser.first_name} ${cachedUser.last_name}`;
    }
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
