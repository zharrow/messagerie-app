import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarStatus from '@/components/ui/AvatarStatus';
import { X, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import type { Conversation, User } from '@/types/chat';

interface GroupSettingsModalProps {
  isOpen: boolean;
  conversation: Conversation;
  currentUserId: number;
  users: User[];
  onClose: () => void;
  onAddMembers: (userIds: number[]) => Promise<void>;
  onRemoveMember: (userId: number) => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  getUserDisplayName: (userId: number) => string;
  getUserInitials: (userId: number) => string;
  onlineUsers: Set<number>;
}

const GroupSettingsModal = ({
  isOpen,
  conversation,
  currentUserId,
  users,
  onClose,
  onAddMembers,
  onRemoveMember,
  onDeleteGroup,
  getUserDisplayName,
  getUserInitials,
  onlineUsers,
}: GroupSettingsModalProps) => {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isAdmin = conversation.groupAdmin === currentUserId;

  // Filter users not in the conversation
  const availableUsers = users.filter(
    (u) => !conversation.participants.includes(u.id) && u.id !== currentUserId
  );

  const filteredUsers = availableUsers.filter((user) =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    setIsLoading(true);
    try {
      await onAddMembers(selectedUsers);
      setSelectedUsers([]);
      setSearchQuery('');
      setShowAddMembers(false);
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Erreur lors de l\'ajout des membres');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;
    setIsLoading(true);
    try {
      await onRemoveMember(userId);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Erreur lors du retrait du membre');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    setIsLoading(true);
    try {
      await onDeleteGroup();
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Erreur lors de la suppression du groupe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Paramètres du groupe</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Group Name */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Nom du groupe</h3>
            <p className="text-lg font-semibold text-gray-900">{conversation.groupName}</p>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Membres ({conversation.participants.length})
              </h3>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMembers(!showAddMembers)}
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              )}
            </div>

            {/* Add Members Section */}
            {showAddMembers && isAdmin && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white"
                />
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {searchQuery ? 'Aucun utilisateur trouvé' : 'Tous les utilisateurs sont déjà membres'}
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleToggleUser(user.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.includes(user.id)
                            ? 'bg-primary-100 border-2 border-primary-500'
                            : 'bg-white hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <AvatarStatus
                          fallback={`${user.first_name[0]}${user.last_name[0]}`}
                          isOnline={false}
                          className="h-10 w-10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {selectedUsers.length > 0 && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={handleAddMembers}
                      disabled={isLoading}
                      className="flex-1 bg-primary-600 hover:bg-primary-700"
                    >
                      Ajouter ({selectedUsers.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUsers([]);
                        setShowAddMembers(false);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Current Members List */}
            <div className="space-y-2">
              {conversation.participants.map((participantId) => {
                const isOnline = onlineUsers.has(participantId);
                const isMemberAdmin = conversation.groupAdmin === participantId;
                const isCurrentUser = participantId === currentUserId;

                return (
                  <div
                    key={participantId}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <AvatarStatus
                      fallback={getUserInitials(participantId)}
                      isOnline={isOnline}
                      className="h-12 w-12"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {getUserDisplayName(participantId)}
                        {isCurrentUser && ' (Vous)'}
                      </p>
                      {isMemberAdmin && (
                        <p className="text-xs text-primary-600 font-medium">Administrateur</p>
                      )}
                    </div>
                    {isAdmin && !isMemberAdmin && !isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(participantId)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Retirer
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          {isAdmin && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Zone de danger
              </h3>
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer le groupe
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800">
                    Êtes-vous vraiment sûr ? Cette action est irréversible et supprimera toutes les
                    messages et fichiers du groupe.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteGroup}
                      disabled={isLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Oui, supprimer définitivement
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
