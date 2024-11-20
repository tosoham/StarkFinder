import axios, { AxiosResponse } from "axios";

export class TelegramClient {
    private baseUrl: string;
    
    constructor(private token: string) {
      this.baseUrl = `https://api.telegram.org/bot${token}`;
    }
  
    async sendMessage(chatId: number, text: string, options: {
      replyToMessageId?: number;
      parseMode?: 'Markdown' | 'HTML';
    } = {}): Promise<AxiosResponse> {
      try {
        return await axios.get(`${this.baseUrl}/sendMessage`, {
          params: {
            chat_id: chatId,
            text,
            parse_mode: options.parseMode || 'Markdown',
            reply_to_message_id: options.replyToMessageId
          }
        });
      } catch (error) {
        console.error('Send Message Error:', error);
        throw error;
      }
    }
  
    async editMessage(chatId: number, messageId: number, text: string): Promise<AxiosResponse> {
      try {
        return await axios.get(`${this.baseUrl}/editMessageText`, {
          params: {
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: 'Markdown'
          }
        });
      } catch (error) {
        console.error('Edit Message Error:', error);
        throw error;
      }
    }
  
    async deleteMessage(chatId: number, messageId: number): Promise<AxiosResponse> {
      try {
        return await axios.get(`${this.baseUrl}/deleteMessage`, {
          params: {
            chat_id: chatId,
            message_id: messageId
          }
        });
      } catch (error) {
        console.error('Delete Message Error:', error);
        throw error;
      }
    }
  }
  
  