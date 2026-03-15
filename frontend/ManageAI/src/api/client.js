import axios from 'axios';

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const chatAPI = {
  /**
   * @param {string} message
   * @param {Array}  conversationHistory  [{role, content}, ...]
   * @param {string|null} imageBase64     Optional base64 data URL
   */
  sendMessage: (message, conversationHistory = [], imageBase64 = null) =>
    api.post('/chat/', {
      message,
      conversation_history: conversationHistory,
      image_base64: imageBase64 || undefined,
    }),
};

export const memoryAPI = {
  getAll: (topic = null) => {
    const params = {};
    if (topic) params.topic = topic;
    return api.get('/memories/', { params });
  },
  delete: (id) =>
    api.delete('/memories/', { params: { id } }),
};

export const searchAPI = {
  search: (query) =>
    api.post('/search/', { query }),
};

export const flashcardAPI = {
  getAll: ()           => api.get('/flashcards/'),
  generate: (memoryId) => api.post('/summarize/', { memory_id: memoryId }),
  bulkGenerate: ()     => api.post('/flashcards/bulk/'),
};

export const topicAPI = {
  getTopics: () => api.get('/topics/'),
};

export const sessionAPI = {
  list:        ()         => api.get('/sessions/'),
  create:      (title)    => api.post('/sessions/', { title }),
  get:         (id)       => api.get(`/sessions/${id}/`),
  update:      (id, data) => api.patch(`/sessions/${id}/`, data),
  delete:      (id)       => api.delete(`/sessions/${id}/`),
  getMessages: (id)       => api.get(`/sessions/${id}/messages/`),
};