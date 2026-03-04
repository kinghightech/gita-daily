// AI Conversation entity
// NOTE: Needs base44 API
export interface AIConversation {
  id: string;
  userId: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}
