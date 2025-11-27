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

export interface Attachment {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface Message {
  _id: string;
  from: number;
  content: string;
  createdAt: string;
  readBy: number[];
  reactions?: Reaction[];
  attachments?: Attachment[];
}

export interface Conversation {
  _id: string;
  participants: number[];
  isGroup: boolean;
  groupName?: string;
  groupAdmin?: number;
  messages: Message[];
  lastMessage?: {
    content: string;
    from: number;
    createdAt: string;
  };
}
