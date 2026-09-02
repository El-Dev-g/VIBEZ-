/**
 * Helper to normalize and obtain standardized Socket.IO room names for chats.
 * Ensures room naming is consistent throughout the server and prevents "chat_chat_..." anomalies.
 */
export function getChatRoomName(chatId: string): string {
  if (!chatId) return '';
  // Strip any leading "chat_" prefixes to get the pure database/chat identifier
  let cleanId = chatId.trim();
  while (cleanId.startsWith('chat_')) {
    cleanId = cleanId.substring(5);
  }
  return `chat_${cleanId}`;
}

/**
 * Helper to extract pure database Chat ID if a client accidentally passes a room name.
 */
export function extractPureChatId(input: string): string {
  if (!input) return '';
  let cleanId = input.trim();
  while (cleanId.startsWith('chat_')) {
    cleanId = cleanId.substring(5);
  }
  return cleanId;
}
