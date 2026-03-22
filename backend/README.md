# Qyzen Backend (Django REST API)

## Prerequisites

- Python 3.11+
- PostgreSQL

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

   - `pip install -r requirements.txt`

3. Create `.env` in `backend/` (you can copy from `.env.example`).
4. Run migrations:

   - `python manage.py makemigrations`
   - `python manage.py migrate`

5. Create a superuser (optional):

   - `python manage.py createsuperuser`

6. Run the server:

   - `python manage.py runserver`

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login` (returns JWT access/refresh)

Include the access token for protected endpoints:

- `Authorization: Bearer <access_token>`

## Quiz API

- `POST /api/quiz/generate`
- `GET /api/quiz/{id}`
- `POST /api/quiz/submit`
- `GET /api/quiz/history`

## AI / Gemini

- If `GEMINI_API_KEY` is not set, quiz generation uses a mock generator.
- To enable Gemini, set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in `.env`.
