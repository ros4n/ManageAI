import os
import json
from google import genai
from groq import Groq


# Initialize Gemini client for embeddings
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize Groq client for chat
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


TOPIC_KEYWORDS = {
    "Algorithms": [
        "binary search", "quicksort", "merge sort", "bubble sort", "sorting",
        "dijkstra", "bfs", "dfs", "dynamic programming", "recursion",
        "tree", "graph", "heap", "stack", "queue", "linked list",
        "time complexity", "big o", "space complexity"
    ],
    "Programming": [
        "python", "javascript", "java", "c++", "typescript", "rust",
        "function", "class", "object", "api", "async", "await",
        "code", "debug", "variable", "loop", "array", "list",
        "django", "react", "flask", "node", "express"
    ],
    "Math": [
        "integral", "derivative", "matrix", "linear algebra", "calculus",
        "probability", "statistics", "equation", "theorem", "proof",
        "vector", "eigenvalue", "gradient", "fourier"
    ],
    "Physics": [
        "force", "velocity", "acceleration", "energy", "momentum",
        "quantum", "relativity", "gravity", "wave", "particle",
        "thermodynamics", "entropy", "electromagnetic"
    ],
    "Database": [
        "sql", "query", "table", "join", "index", "schema",
        "postgresql", "mysql", "mongodb", "nosql", "orm",
        "migration", "transaction", "normalization"
    ],
}


def detect_topic(text: str) -> str:
    text_lower = text.lower()

    for topic, keywords in TOPIC_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return topic

    return "General"


def generate_embedding(text: str) -> list:
    """
    Generate vector embeddings using Gemini
    """
    try:
        response = gemini_client.models.embed_content(
            model="text-embedding-004",
            contents=text
        )

        return response.embeddings[0].values

    except Exception as e:
        print(f"Embedding error: {e}")
        return None


def get_groq_response(messages: list, system_prompt: str = None) -> str:
    """
    Generate AI response using Groq + Llama3
    """
    try:
        system = system_prompt or (
            "You are ThinkVault, a friendly and knowledgeable AI tutor. "
            "Be clear, educational, and concise. "
            "Use code blocks when explaining programming concepts. "
            "Format your answers with proper markdown."
        )

        full_messages = [{"role": "system", "content": system}] + messages

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=full_messages,
            max_tokens=1024,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Groq error: {e}")
        return f"Sorry, I encountered an error: {str(e)}"


def generate_summary(question: str, answer: str) -> str:
    """
    Generate a short summary of a Q&A
    """
    try:
        prompt = f"""
Summarize this Q&A into 2-3 bullet points. Be very concise.

Question: {question}
Answer: {answer}

Respond with only the bullet points, nothing else.
"""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Summary error: {e}")
        return ""


def generate_flashcard(question: str, answer: str) -> dict:
    """
    Convert Q&A into a flashcard
    """
    try:
        prompt = f"""
Convert this Q&A into a single flashcard.

Return ONLY a JSON object with keys "front" and "back".

"front" = short question (max 15 words)  
"back" = concise answer (max 50 words)

Q: {question}
A: {answer}

JSON:
"""

        response = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )

        text = response.choices[0].message.content.strip()

        # Remove markdown formatting if present
        text = text.replace("```json", "").replace("```", "").strip()

        return json.loads(text)

    except Exception as e:
        print(f"Flashcard error: {e}")

        return {
            "front": question[:100],
            "back": answer[:200]
        }