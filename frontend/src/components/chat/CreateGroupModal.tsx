import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarStatus from '@/components/ui/AvatarStatus';
import { X, Users, Check } from 'lucide-react';
import type { User } from '@/types/chat';

interface CreateGroupModalProps {
  isOpen: boolean;
  users: User[];
  loadingUsers: boolean;
  currentUserId: number;
  onClose: () => void;
  onCreateGroup: (groupName: string, selectedUserIds: number[]) => void;
}

const CreateGroupModal = ({
  isOpen,
  users,
  loadingUsers,
  currentUserId,
  onClose,
  onCreateGroup,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreate = () => {
    if (selectedUsers.size === 0) {
      alert('Veuillez sélectionner au moins 1 membre');
      return;
    }

    if (selectedUsers.size === 1) {
      // Single user: create private conversation
      onCreateGroup('', Array.from(selectedUsers));
    } else {
      // Multiple users: create group with name
      if (!groupName.trim()) {
        alert('Veuillez entrer un nom de groupe');
        return;
      }
      onCreateGroup(groupName.trim(), Array.from(selectedUsers));
    }

    // Reset state
    setGroupName('');
    setSelectedUsers(new Set());
    setSearchQuery('');
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers(new Set());
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUserId &&
      (u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isGroup = selectedUsers.size > 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {isGroup ? 'Nouveau groupe' : 'Nouvelle conversation'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Group name input (only if group) */}
        {isGroup && (
          <div className="p-4 border-b">
            <Input
              placeholder="Nom du groupe..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Selected users count */}
        {selectedUsers.size > 0 && (
          <div className="px-4 py-2 bg-accent/50 border-b">
            <p className="text-sm text-muted-foreground">
              {selectedUsers.size} membre{selectedUsers.size > 1 ? 's' : ''} sélectionné{selectedUsers.size > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Search bar */}
        <div className="p-4 border-b">
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users list */}
        <div className="max-h-96 overflow-y-auto">
          {loadingUsers ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement des utilisateurs...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun autre utilisateur disponible'}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUsers.has(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUserSelection(u.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors flex items-center gap-3 ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                >
                  <AvatarStatus
                    fallback={`${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`}
                    isOnline={false}
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedUsers.size === 0 || (isGroup && !groupName.trim())}
            className="flex-1"
          >
            {isGroup ? 'Créer le groupe' : 'Créer la conversation'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
