import os
import json
from google import genai 
from groq import Groq

client_genai = genai.Client(api_key=os.getenv('GEMINI_API_KEY'),http_options={'api_version': 'v1beta'},)
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))


CHAT_MODEL = 'llama-3.3-70b-versatile'

TOPIC_KEYWORDS = {
    'Algorithms': [
        'binary search', 'quicksort', 'merge sort', 'bubble sort', 'sorting',
        'dijkstra', 'bfs', 'dfs', 'dynamic programming', 'recursion',
        'tree', 'graph', 'heap', 'stack', 'queue', 'linked list',
        'time complexity', 'big o', 'space complexity',
    ],
    'Programming': [
        'python', 'javascript', 'java', 'c++', 'typescript', 'rust',
        'function', 'class', 'object', 'api', 'async', 'await',
        'code', 'debug', 'variable', 'loop', 'array', 'list',
        'django', 'react', 'flask', 'node', 'express',
    ],
    'Math': [
        'integral', 'derivative', 'matrix', 'linear algebra', 'calculus',
        'probability', 'statistics', 'equation', 'theorem', 'proof',
        'vector', 'eigenvalue', 'gradient', 'fourier',
    ],
    'Physics': [
        'force', 'velocity', 'acceleration', 'energy', 'momentum',
        'quantum', 'relativity', 'gravity', 'wave', 'particle',
        'thermodynamics', 'entropy', 'electromagnetic',
    ],
    'Database': [
        'sql', 'query', 'table', 'join', 'index', 'schema',
        'postgresql', 'mysql', 'mongodb', 'nosql', 'orm',
        'migration', 'transaction', 'normalization',
    ],
}


def detect_topic(text: str) -> str:
    text_lower = text.lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return topic
    return 'General'


def generate_embedding(text: str) -> list:
    try:
        result = client_genai.models.embed_content(
            model='gemini-embedding-001',
            contents=text,
        )
        return result.embeddings[0].values
    except Exception as e:
        print(f'Embedding error: {e}')
        return None


def get_groq_response(messages: list, system_prompt: str = None) -> str:
    try:
        system = system_prompt or (
            'You are ManageAI, a friendly and knowledgeable AI assistant with memory. '
            'Be clear, helpful, and concise. Use markdown and code blocks when appropriate.'
        )
        full_messages = [{'role': 'system', 'content': system}] + messages

        response = groq_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=full_messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f'Groq error: {e}')
        return f'Sorry, I encountered an error: {str(e)}'


def generate_summary(question: str, answer: str) -> str:
    try:
        response = groq_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{
                'role': 'user',
                'content': (
                    f'Summarize this Q&A in 2-3 short bullet points:\n\n'
                    f'Q: {question}\nA: {answer}\n\nJust the bullets, nothing else.'
                ),
            }],
            max_tokens=200,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f'Summary error: {e}')
        return ''


def generate_flashcard(question: str, answer: str) -> dict:
    try:
        response = groq_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{
                'role': 'user',
                'content': (
                    f'Convert this Q&A into a flashcard.\n'
                    f'Return ONLY a JSON object with keys "front" (max 15 words) '
                    f'and "back" (max 50 words). No extra text.\n\n'
                    f'Q: {question}\nA: {answer}\n\nJSON:'
                ),
            }],
            max_tokens=150,
        )
        text = response.choices[0].message.content.strip()
        text = text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f'Flashcard error: {e}')
        return {'front': question[:100], 'back': answer[:200]}