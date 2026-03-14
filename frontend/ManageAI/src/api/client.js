import axios from "axios";

/* ---------------- CONFIG ---------------- */

const MOCK_MODE = false; // set false when backend is ready

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/";
const USER_ID = "hackathon-demo-user";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/* ---------------- MOCK DATA ---------------- */

const mockMemories = [
  { id: 1, content: "AI is transforming healthcare", topic: "AI" },
  { id: 2, content: "Neural networks learn patterns", topic: "ML" },
];

const mockFlashcards = [
  { id: 1, question: "What is AI?", answer: "Artificial Intelligence" },
  { id: 2, question: "What is ML?", answer: "Machine Learning" },
];

/* ---------------- CHAT ---------------- */

export const chatAPI = {
  sendMessage: async (message) => {
    if (MOCK_MODE) {
      // keep same shape as backend
      return Promise.resolve({
        data: { answer: "This is a mock AI response for: " + message },
      });
    }

    // no leading slash -> respects baseURL /api/
    const res = await api.post("chat/", {
      message,
      user_id: USER_ID,
    });

    // normalize response shape for UI
    return {
      data: {
        ...res.data,
        answer: res.data.answer ?? res.data.reply ?? "",
      },
    };
  },
};

/* ---------------- MEMORIES ---------------- */

export const memoryAPI = {
  getAll: async (topic = null) => {
    if (MOCK_MODE) {
      const data = topic
        ? mockMemories.filter((m) => m.topic === topic)
        : mockMemories;
      return Promise.resolve({ data });
    }

    return api.get("memories/", {
      params: { user_id: USER_ID, ...(topic ? { topic } : {}) },
    });
  },

  delete: async (id) => {
    if (MOCK_MODE) {
      return Promise.resolve({ data: { success: true } });
    }

    return api.delete(`memories/${id}/`, {
      params: { user_id: USER_ID },
    });
  },
};

/* ---------------- SEARCH ---------------- */

export const searchAPI = {
  search: async (query) => {
    if (MOCK_MODE) {
      return Promise.resolve({
        data: mockMemories.filter((m) =>
          m.content.toLowerCase().includes(query.toLowerCase())
        ),
      });
    }

    return api.post("/search/", {
      query,
      user_id: USER_ID,
    });
  },
};

/* ---------------- FLASHCARDS ---------------- */

export const flashcardAPI = {
  getAll: async () => {
    if (MOCK_MODE) {
      return Promise.resolve({ data: mockFlashcards });
    }

    return api.get("flashcards/", {
      params: { user_id: USER_ID },
    });
  },

  bulkGenerate: async () => {
    if (MOCK_MODE) {
      return Promise.resolve({ data: mockFlashcards });
    }

    return api.post("flashcards/bulk-generate/", {
      user_id: USER_ID,
    });
  },
};

/* ---------------- TOPICS ---------------- */

export const topicAPI = {
  getTopics: async () => {
    if (MOCK_MODE) {
      return Promise.resolve({
        data: ["AI", "Machine Learning", "Data Science"],
      });
    }

    return api.get("/topics/", {
      params: { user_id: USER_ID },
    });
  },
};