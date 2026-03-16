# ManageAI — Smart Memory Chat

An AI-powered chat application with persistent memory, semantic search, and flashcard generation. Every conversation is automatically saved, embedded, and made searchable using vector similarity.

---
# Demo video:
https://drive.google.com/file/d/1HGFi2x4z57GBqJurJOgxfTmFN9D5wiDh/view?usp=sharing
## Features

- **Persistent Memory** — Every Q&A is saved to a PostgreSQL database with vector embeddings
- **Semantic Search** — Search across all past conversations using cosine similarity (not just keywords)
- **Multi-Model Support** — Switch between Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, and Gemma 2 9B
- **RAG (Retrieval-Augmented Generation)** — Relevant past memories are automatically injected as context before each response
- **Flashcard Generation** — Auto-generate study flashcards from saved memories
- **Study Mode** — Interactive flashcard study with progress tracking
- **Memory Dashboard** — Browse, filter, and delete saved memories by topic
- **PDF Export** — Export all memories as a formatted PDF report
- **Voice Input** — Speak your questions using the browser's Speech Recognition API
- **Text-to-Speech** — Listen to any AI response read aloud
- **Topic Detection** — Automatically tags each memory (Algorithms, Programming, Math, Physics, Database, Geography, General)

---

## Tech Stack

### Frontend
- React (Vite)
- Axios
- ReactMarkdown

### Backend
- Django 6 + Django REST Framework
- PostgreSQL + pgvector (vector similarity search)
- Groq API (Llama, Mixtral, Gemma models)
- Google Gemini API (embeddings via `gemini-embedding-001`)
- jsPDF (PDF export)

---

## Project Structure

```
ManageAI/
├── backend/
│   └── manageai/
│       ├── manage.py
│       ├── manageai/
│       │   ├── settings.py
│       │   └── urls.py
│       └── api/
│           ├── models.py
│           ├── views.py
│           ├── serializers.py
│           ├── urls.py
│           └── utils.py
└── frontend/
    └── src/
        ├── App.jsx
        ├── api/
        │   └── client.js
        └── pages/
            ├── Chat.jsx
            ├── Dashboard.jsx
            ├── Search.jsx
            └── Flashcards.jsx
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Groq API key — [console.groq.com](https://console.groq.com)
- Google Gemini API key — [aistudio.google.com](https://aistudio.google.com)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourname/manageai.git
cd manageai
```

### 2. PostgreSQL setup

Connect to your PostgreSQL instance and run:

```sql
CREATE DATABASE manageai;
\c manageai
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/manageai/`:

```env
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
DB_NAME=manageai
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

Run migrations:

```bash
cd manageai
python manage.py makemigrations
python manage.py migrate
```

Start the server:

```bash
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for embeddings |
| `GROQ_API_KEY` | Groq API key for chat models |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | PostgreSQL host (default: localhost) |
| `DB_PORT` | PostgreSQL port (default: 5432) |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/` | Send a message, get AI response |
| GET | `/api/models/` | List available AI models |
| GET | `/api/memories/` | Get all saved memories |
| DELETE | `/api/memories/?id=<id>` | Delete a memory |
| POST | `/api/search/` | Semantic search across memories |
| GET | `/api/topics/` | Get all topics with counts |
| GET | `/api/flashcards/` | Get all flashcards |
| POST | `/api/flashcards/bulk/` | Auto-generate flashcards from memories |
| POST | `/api/format-memory/` | Format a memory for PDF export |

---

## How RAG Works

1. User sends a message
2. `gemini-embedding-001` converts the message into a 3072-dimensional vector
3. PostgreSQL computes cosine distance between the query vector and all stored memory vectors
4. Memories with `distance < 0.4` are considered relevant and injected into the system prompt
5. The selected chat model (Llama/Mixtral/Gemma) generates a response with that context
6. The new Q&A is embedded and saved to the database for future retrieval

```
User message → Embedding → Vector search (distance < 0.4)
                                    ↓
                          Relevant memories injected
                                    ↓
                          Chat model generates answer
                                    ↓
                          New Q&A saved + embedded to DB
```

---

## Available Chat Models

| Model | Best For |
|---|---|
| Llama 3.3 70B | Best quality, complex topics |
| Llama 3.1 8B | Fastest responses, simple questions |
| Mixtral 8x7B | Coding and technical topics |
| Gemma 2 9B | Reasoning tasks |

---

## Topic Categories

Memories are automatically tagged into one of these topics based on keyword detection:

- **Algorithms** — sorting, graphs, dynamic programming, complexity
- **Programming** — Python, JavaScript, frameworks, debugging
- **Math** — calculus, linear algebra, statistics, proofs
- **Physics** — mechanics, quantum, thermodynamics
- **Database** — SQL, joins, indexes, migrations
- **Geography** — locations, countries, cities, places
- **General** — everything else

---

## Requirements

### Backend (`requirements.txt`)
```
django
djangorestframework
django-cors-headers
psycopg2-binary
pgvector
google-genai
groq
python-dotenv
jsPDF
```

### Frontend (`package.json` dependencies)
```
react
react-dom
axios
react-markdown
jspdf
```

---

## Notes

- The `gemini-embedding-001` model produces 3072-dimensional vectors. Make sure your `VectorField` uses `dimensions=3072`
- The cosine distance threshold of `0.4` is tuned for `gemini-embedding-001`. Values above `0.5` will return irrelevant results
- Voice input requires Chrome or Edge (uses Web Speech API)
- PDF export uses AI formatting via Groq to clean markdown before generating the document
