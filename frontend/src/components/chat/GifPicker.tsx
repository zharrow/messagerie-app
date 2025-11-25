import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, Clapperboard } from 'lucide-react';

interface GifPickerProps {
  isOpen: boolean;
  searchQuery: string;
  gifResults: any[];
  loadingGifs: boolean;
  onSearchChange: (query: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
  onLoadTrending: () => void;
}

const GifPicker = ({
  isOpen,
  searchQuery,
  gifResults,
  loadingGifs,
  onSearchChange,
  onSelectGif,
  onClose,
  onLoadTrending,
}: GifPickerProps) => {
  useEffect(() => {
    if (isOpen && gifResults.length === 0 && !searchQuery) {
      onLoadTrending();
    }
  }, [isOpen, gifResults.length, searchQuery, onLoadTrending]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Choisir un GIF</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher un GIF..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingGifs ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : gifResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gifResults.map((gif) => {
                const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
                return (
                  <button
                    key={gif.id}
                    onClick={() => onSelectGif(gifUrl)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-muted"
                  >
                    <img
                      src={gifUrl}
                      alt={gif.content_description || 'GIF'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Clapperboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchQuery
                    ? 'Aucun GIF trouvé'
                    : 'Recherchez un GIF ou parcourez les tendances'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Propulsé par Tenor
          </p>
        </div>
      </div>
    </div>
  );
};

export default GifPicker;
