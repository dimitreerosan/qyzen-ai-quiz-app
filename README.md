# Qyzen: AI-Powered Quiz Platform

I built Qyzen to solve a simple problem: most quiz platforms focus on repetitive questions, but developers need targeted, niche technical tests. Qyzen uses AI to generate personalized quizzes on any topic, at any difficulty level, instantly.

---

## Getting Started

### Prerequisites
You'll need Python 3.10+ for the backend and Node.js 18+ for the frontend. You also need a Gemini API key to handle the quiz generation logic.

### 1. Backend Setup
Go to the `backend` folder and set up a virtual environment:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Make sure you create a `.env` file in the `backend` directory and add your `GEMINI_API_KEY`.

### 2. Frontend Setup
Navigate to the `frontend` folder and install the dependencies:
```bash
cd frontend
npm install
npm run dev
```
The app should be running at `http://localhost:3000`.

---

## Architectural Decisions

### Database Design
I chose a relational structure using the Django ORM because I wanted clear, enforceable links between quizzes, questions, and user attempts. 
- The **Quiz** model stores the main topic, difficulty, and the time limit the AI suggested.
- **Questions** and **Options** are linked directly to each quiz.
- **Attempts** and **Answers** keep track of every user session, which was important for the analytics history feature.

### API Structure
I used Django REST Framework (DRF) to keep the API clean and predictable.
- `POST /quiz/generate`: This is where the magic happens. It calls my AI service and builds the entire quiz object in one go.
- `POST /quiz/submit`: This handles the scoring server-side to prevent tampering.
- `GET /quiz/history`: Fetches the audit trail for the user.

### Design System
I went for a "Slate" aesthetic with the **Outfit** font. I wanted the UI to feel "soft" and human, so I used rounded-xl corners and a minimalist color palette rather than harsh, boxed-in designs.

---

## Challenges I Faced

1. **AI Consistency**: Getting an LLM to consistently return valid JSON with exactly four options was a struggle. I ended up implementing a strict validation layer on the backend that retries or rejects malformed AI responses before they ever hit the database.
2. **The Timer Logic**: Synchronizing a real-time countdown on the frontend with a server-side time limit was tricky. I used a custom React hook to manage the timer and ensured it automatically submits the quiz the second time runs out.
3. **Layout Flow**: I wanted a persistent sidebar that didn't feel like it was "outside" the page. Designing the `AppFrame` component to wrap all my routes consistently was the solution there.

---

## Implementation Status

### What's done:
- Full AI-powered MCQ generation.
- Dynamic timer and auto-submission logic.
- A "Custom Quiz" hub for any technical topic.
- A historical dashboard to track progress.
- A fully responsive "Slate" themed UI.

### What's skipped:
- **Real-time Multiplayer**: I thought about adding WebSockets for head-to-head quizzes, but I decided to focus on making the single-player AI experience solid first.
- **Social Sharing**: I plan to add "Share Result" buttons in the future, but for this submission, I prioritized the core utility and analytics.

---

## Author
Hand-crafted by a developer focused on blending AI utility with clean design.
