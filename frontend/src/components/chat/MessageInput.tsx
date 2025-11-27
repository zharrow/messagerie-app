import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Clapperboard, Paperclip, X, Image as ImageIcon, FileText, Flame } from 'lucide-react';

interface MessageInputProps {
  messageInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onSendMessageWithFiles: (files: File[]) => void;
  onOpenGifPicker: () => void;
  onFireCommand?: () => void;
}

const MessageInput = ({
  messageInput,
  onInputChange,
  onSendMessage,
  onSendMessageWithFiles,
  onOpenGifPicker,
  onFireCommand,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showCommandAutocomplete, setShowCommandAutocomplete] = useState(false);

  // Command detection
  const commands = [
    { name: '/fire', description: '🔥 Détruire la conversation avec style', icon: Flame }
  ];

  useEffect(() => {
    // Show autocomplete if input starts with /
    if (messageInput.startsWith('/') && messageInput.length > 0) {
      const matchingCommands = commands.filter(cmd =>
        cmd.name.startsWith(messageInput.toLowerCase())
      );
      setShowCommandAutocomplete(matchingCommands.length > 0);
    } else {
      setShowCommandAutocomplete(false);
    }
  }, [messageInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab to autocomplete /fire
    if (e.key === 'Tab' && showCommandAutocomplete && messageInput.startsWith('/')) {
      e.preventDefault();
      onInputChange('/fire');
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // Max 5 files as per backend
      if (fileArray.length > 5) {
        alert('Maximum 5 fichiers à la fois');
        return;
      }
      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = fileArray.filter(f => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        alert('Certains fichiers dépassent 10MB');
        return;
      }
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    // Check for /fire command
    if (messageInput.trim() === '/fire') {
      if (onFireCommand) {
        onFireCommand();
        onInputChange('');
      }
      return;
    }

    if (selectedFiles.length > 0) {
      onSendMessageWithFiles(selectedFiles);
      setSelectedFiles([]);
    } else if (messageInput.trim()) {
      onSendMessage();
    }
  };

  const handleCommandClick = (command: string) => {
    if (command === '/fire' && onFireCommand) {
      onFireCommand();
      onInputChange('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className="px-5 py-3 border-t bg-white relative">
      {/* Command autocomplete */}
      {showCommandAutocomplete && (
        <div className="absolute bottom-full left-5 right-5 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
          {commands.filter(cmd => cmd.name.startsWith(messageInput.toLowerCase())).map((cmd) => (
            <button
              key={cmd.name}
              onClick={() => handleCommandClick(cmd.name)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <cmd.icon className="h-5 w-5 text-[#D84E47]" />
              <div>
                <p className="font-semibold text-gray-900">{cmd.name}</p>
                <p className="text-sm text-gray-500">{cmd.description}</p>
              </div>
              <span className="ml-auto text-xs text-gray-400">Tab</span>
            </button>
          ))}
        </div>
      )}

      {/* File preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 bg-gray-100 rounded-xl p-2.5 pr-8 max-w-xs"
            >
              {isImage(file) ? (
                <ImageIcon className="h-4 w-4 text-[#D84E47] flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-[#D84E47] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          title="Joindre un fichier"
          className="h-9 w-9 rounded-full hover:bg-gray-100"
        >
          <Paperclip className="h-5 w-5 text-[#D84E47]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenGifPicker}
          title="Envoyer un GIF"
          className="h-9 w-9 rounded-full hover:bg-gray-100"
        >
          <Clapperboard className="h-5 w-5 text-[#D84E47]" />
        </Button>
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Aa"
            value={messageInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-gray-100 border-0 rounded-full px-4 py-2 focus-visible:ring-1 focus-visible:ring-[#D84E47] pr-10"
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!messageInput.trim() && selectedFiles.length === 0}
          size="icon"
          className="h-9 w-9 rounded-full bg-[#D84E47] hover:bg-[#C44440] disabled:bg-gray-300"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
