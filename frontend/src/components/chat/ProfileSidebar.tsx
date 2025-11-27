import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AvatarStatus from '@/components/ui/AvatarStatus';
import { X, Users, Image, FileText, Settings, UserPlus, UserMinus } from 'lucide-react';
import type { Conversation, User as ChatUser } from '@/types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost';

interface ProfileSidebarProps {
  isOpen: boolean;
  conversation: Conversation | null;
  currentUserId: number;
  onClose: () => void;
  getUserDisplayName: (userId: number) => string;
  getUserInitials: (userId: number) => string;
  onlineUsers: Set<number>;
  onOpenGroupSettings?: () => void;
}

type TabType = 'info' | 'media' | 'files';

const ProfileSidebar = ({
  isOpen,
  conversation,
  currentUserId,
  onClose,
  getUserDisplayName,
  getUserInitials,
  onlineUsers,
  onOpenGroupSettings,
}: ProfileSidebarProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');

  if (!isOpen || !conversation) return null;

  const isGroup = conversation.isGroup;
  const otherParticipantId = !isGroup ? conversation.participants.find((p) => p !== currentUserId) : null;
  const isOtherOnline = otherParticipantId ? onlineUsers.has(otherParticipantId) : false;

  // Extract images from messages
  const imageAttachments = conversation.messages
    ?.flatMap((msg) => msg.attachments || [])
    .filter((att) => att.mimeType?.startsWith('image/')) || [];

  // Extract non-image files from messages
  const fileAttachments = conversation.messages
    ?.flatMap((msg) => msg.attachments || [])
    .filter((att) => !att.mimeType?.startsWith('image/')) || [];

  // Helper pour construire l'URL complète des fichiers
  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const renderInfoTab = () => (
    <div className="space-y-6">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="relative">
          {isGroup ? (
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          ) : (
            <AvatarStatus
              fallback={getUserInitials(otherParticipantId!)}
              isOnline={isOtherOnline}
              className="h-24 w-24 text-2xl"
            />
          )}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {isGroup && conversation.groupName
              ? conversation.groupName
              : otherParticipantId
              ? getUserDisplayName(otherParticipantId)
              : 'Conversation'}
          </h2>
          {!isGroup && isOtherOnline && (
            <p className="text-sm text-green-500">En ligne</p>
          )}
          {!isGroup && !isOtherOnline && (
            <p className="text-sm text-muted-foreground">Hors ligne</p>
          )}
        </div>
      </div>

      {/* Group Members */}
      {isGroup && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Membres ({conversation.participants.length})
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {conversation.participants.map((participantId) => {
              const isOnline = onlineUsers.has(participantId);
              const isAdmin = conversation.groupAdmin === participantId;
              const isCurrentUser = participantId === currentUserId;

              return (
                <div
                  key={participantId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <AvatarStatus
                    fallback={getUserInitials(participantId)}
                    isOnline={isOnline}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {getUserDisplayName(participantId)}
                      {isCurrentUser && ' (Vous)'}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-muted-foreground">Administrateur</p>
                    )}
                  </div>
                  {conversation.groupAdmin === currentUserId && participantId !== currentUserId && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation Stats */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Statistiques</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Messages</span>
            <span className="font-medium">{conversation.messages?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Photos</span>
            <span className="font-medium">{imageAttachments.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fichiers</span>
            <span className="font-medium">{fileAttachments.length}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {isGroup && conversation.groupAdmin === currentUserId && onOpenGroupSettings && (
        <div className="border-t pt-4">
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={onOpenGroupSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Paramètres du groupe
          </Button>
        </div>
      )}
    </div>
  );

  const renderMediaTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground px-4">
        Photos partagées ({imageAttachments.length})
      </h3>
      {imageAttachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Image className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Aucune photo partagée</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 px-4">
          {imageAttachments.map((attachment, idx) => {
            const fullUrl = getFullUrl(attachment.url);
            return (
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden bg-accent cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(fullUrl, '_blank')}
              >
                <img
                  src={fullUrl}
                  alt={attachment.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground px-4">
        Fichiers partagés ({fileAttachments.length})
      </h3>
      {fileAttachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Aucun fichier partagé</p>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {fileAttachments.map((attachment, idx) => {
            const sizeInMB = (attachment.size / (1024 * 1024)).toFixed(2);
            const extension = attachment.originalName.split('.').pop()?.toUpperCase() || 'FILE';
            const fullUrl = getFullUrl(attachment.url);

            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => window.open(fullUrl, '_blank')}
              >
                <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{attachment.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {extension} • {sizeInMB} MB
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-80 border-l flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Informations</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'info'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Infos
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'media'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Médias
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Fichiers
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'media' && renderMediaTab()}
        {activeTab === 'files' && renderFilesTab()}
      </div>
    </div>
  );
};

export default ProfileSidebar;
