export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Reaction {
  emoji: string;
  userId: number;
  createdAt: string;
}

export interface Message {
  _id: string;
  from: number;
  content: string;
  createdAt: string;
  readBy: number[];
  reactions?: Reaction[];
}

export interface Conversation {
  _id: string;
  participants: number[];
  isGroup: boolean;
  groupName?: string;
  messages: Message[];
  lastMessage?: {
    content: string;
    from: number;
    createdAt: string;
  };
}
