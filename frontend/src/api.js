import config from './config';

const api = {
  getListing: async (listingId) => {
    const response = await fetch(`${config.API_BASE_URL}/api/listings/${listingId}/`);
    if (!response.ok) throw new Error('Failed to fetch listing');
    return response.json();
  },

  requestPhotos: async (listingId) => {
    const response = await fetch(`${config.API_BASE_URL}/api/listings/${listingId}/request-photos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to request photos');
    return response.json();
  },

  sendChatEvent: async (conversationId, event, data) => {
    const response = await fetch(`${config.API_BASE_URL}/api/chat/events/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        event: event,
        ...data,
      }),
    });
    if (!response.ok) throw new Error(`Failed to send chat event: ${event}`);
    return response.json();
  },
};

export default api;
