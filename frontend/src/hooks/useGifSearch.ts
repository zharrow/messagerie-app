import { useState, useEffect, useCallback } from 'react';

const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
const TENOR_LIMIT = 20;

export const useGifSearch = () => {
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  const searchGifs = useCallback(async (query: string) => {
    if (query.length < 2) {
      setGifResults([]);
      return;
    }
    setLoadingGifs(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}&media_filter=gif`
      );
      const data = await response.json();
      setGifResults(data.results || []);
    } catch (error) {
      console.error('Failed to search GIFs:', error);
      setGifResults([]);
    } finally {
      setLoadingGifs(false);
    }
  }, []);

  const loadTrendingGifs = useCallback(async () => {
    setLoadingGifs(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}&media_filter=gif`
      );
      const data = await response.json();
      setGifResults(data.results || []);
    } catch (error) {
      console.error('Failed to load trending GIFs:', error);
    } finally {
      setLoadingGifs(false);
    }
  }, []);

  // Debounce GIF search
  useEffect(() => {
    if (!gifSearchQuery) return;
    const debounce = setTimeout(() => searchGifs(gifSearchQuery), 500);
    return () => clearTimeout(debounce);
  }, [gifSearchQuery, searchGifs]);

  const resetGifSearch = () => {
    setGifSearchQuery('');
    setGifResults([]);
  };

  return {
    gifSearchQuery,
    setGifSearchQuery,
    gifResults,
    loadingGifs,
    loadTrendingGifs,
    resetGifSearch,
  };
};
