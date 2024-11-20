/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TelegramMessage {
  chat: {
    id: number;
    type?: 'private' | 'group' | 'supergroup';
  };
  from?: {
    id: number;
    username?: string;
  };
  text?: string;
  reply_to_message?: {
    message_id: number;
    text?: string;
  };
  message_id: number;
}

export interface UserState {
  mode: 'ask' | 'transaction' | 'none';
  lastActivity: number;
  groupChat?: boolean;
  connectedWallet?: string;
  pendingTransaction?: {
    data: any;
    timestamp: number;
  };
  lastMessageId?: number;
}