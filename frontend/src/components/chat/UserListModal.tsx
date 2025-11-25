import { Button } from '@/components/ui/button';
import AvatarStatus from '@/components/ui/AvatarStatus';
import { X, MessageCircle } from 'lucide-react';
import type { User } from '@/types/chat';

interface UserListModalProps {
  isOpen: boolean;
  users: User[];
  loadingUsers: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

const UserListModal = ({
  isOpen,
  users,
  loadingUsers,
  onClose,
  onSelectUser,
}: UserListModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Nouvelle conversation</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loadingUsers ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement des utilisateurs...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucun autre utilisateur trouvé
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                onClick={() => onSelectUser(u)}
                className="p-4 border-b cursor-pointer hover:bg-accent transition-colors flex items-center gap-3"
              >
                <AvatarStatus
                  fallback={`${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`}
                  isOnline={false}
                />
                <div className="flex-1">
                  <p className="font-medium">{u.first_name} {u.last_name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
