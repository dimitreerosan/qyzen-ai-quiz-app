import json
import os
import re
from typing import Any, Dict, List

import requests


class AIServiceError(Exception):
    pass


def _mock_mcqs(topic: str, number_of_questions: int, difficulty: str) -> Dict[str, Any]:
    questions = []
    for i in range(number_of_questions):
        questions.append(
            {
                "question": f"[{difficulty}] {topic}: Sample question {i + 1}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "A",
            }
        )
    return {
        "time_limit_minutes": max(5, number_of_questions * 2),
        "questions": questions
    }


def _extract_json(text: str) -> Any:
    # Look for object first, then falling back to list if needed
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if match:
        return json.loads(match.group(0))
    match = re.search(r"\[\s*\{.*\}\s*\]", text, flags=re.DOTALL)
    if match:
        return json.loads(match.group(0))
    raise ValueError("No JSON payload found in AI response")


def generate_mcqs(topic: str, number_of_questions: int, difficulty: str) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

    if not api_key:
        return _mock_mcqs(topic, number_of_questions, difficulty)

    prompt = (
        "Generate a JSON object for a quiz. "
        "The object must have two keys: 'time_limit_minutes' (number) and 'questions' (array). "
        "Each question must be: {question: string, options: [string,string,string,string], correct_answer: 'A'|'B'|'C'|'D'}. "
        f"Topic: {topic}. Difficulty: {difficulty}. Count: {number_of_questions}. "
        "Set 'time_limit_minutes' logically based on the complexity and count (e.g., 1 min per easy Q, 2-3 mins per hard Q). "
        "Return JSON only."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ]
    }

    try:
        resp = requests.post(url, headers=headers, params={"key": api_key}, json=payload, timeout=30)
    except requests.RequestException as exc:
        # Fallback to mock data when AI provider is unavailable
        return _mock_mcqs(topic, number_of_questions, difficulty)

    if resp.status_code >= 400:
        # Fallback to mock data on AI provider HTTP error
        return _mock_mcqs(topic, number_of_questions, difficulty)

    data = resp.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("Unexpected AI response format") from exc

    try:
        parsed = _extract_json(text)
    except Exception:
        # Fallback to mock if AI response parsing fails
        return _mock_mcqs(topic, number_of_questions, difficulty)

    return parsed
