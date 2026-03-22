from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from quiz.models import Answer, Attempt, Option, Question, Quiz
from quiz.serializers import (
    AttemptDetailSerializer,
    AttemptSerializer,
    QuizDetailSerializer,
    QuizGenerateSerializer,
    QuizSubmitSerializer,
    RegisterSerializer,
    UserSerializer,
)
from quiz.services import AIServiceError, generate_mcqs


User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response({"id": user.id, "username": user.username, "email": user.email}, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizGenerateView(APIView):
    def post(self, request):
        serializer = QuizGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        topic = serializer.validated_data["topic"]
        number_of_questions = serializer.validated_data["number_of_questions"]
        difficulty = serializer.validated_data["difficulty"]

        try:
            ai_data = generate_mcqs(topic=topic, number_of_questions=number_of_questions, difficulty=difficulty)
            # Handle both list (old/fallback) and dict (new) responses
            if isinstance(ai_data, dict):
                mcqs = ai_data.get("questions", [])
                time_limit = ai_data.get("time_limit_minutes", 10)
            else:
                mcqs = ai_data
                time_limit = 10
        except AIServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        with transaction.atomic():
            quiz = Quiz.objects.create(
                user=request.user, 
                topic=topic, 
                difficulty=difficulty,
                time_limit_minutes=time_limit
            )

            for item in mcqs:
                question_text = item.get("question")
                options = item.get("options")
                correct = item.get("correct_answer")

                if not question_text or not isinstance(options, list) or len(options) != 4 or correct not in ["A", "B", "C", "D"]:
                    transaction.set_rollback(True)
                    return Response(
                        {"detail": "AI returned invalid question format"},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )

                q = Question.objects.create(quiz=quiz, text=question_text)
                correct_idx = {"A": 0, "B": 1, "C": 2, "D": 3}[correct]
                for idx, opt_text in enumerate(options):
                    Option.objects.create(question=q, text=str(opt_text), is_correct=(idx == correct_idx))

        return Response(QuizDetailSerializer(quiz).data, status=status.HTTP_201_CREATED)


class QuizDetailView(APIView):
    def get(self, request, id: int):
        quiz = get_object_or_404(Quiz, id=id, user=request.user)
        return Response(QuizDetailSerializer(quiz).data, status=status.HTTP_200_OK)


class QuizSubmitView(APIView):
    def post(self, request):
        serializer = QuizSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        quiz_id = serializer.validated_data["quiz_id"]
        answers = serializer.validated_data["answers"]

        quiz = get_object_or_404(Quiz, id=quiz_id, user=request.user)

        question_ids = set(quiz.questions.values_list("id", flat=True))
        score = 0

        with transaction.atomic():
            attempt = Attempt.objects.create(user=request.user, quiz=quiz, score=0)

            for item in answers:
                question_id = item["question_id"]
                selected_option_id = item["selected_option_id"]

                if question_id not in question_ids:
                    transaction.set_rollback(True)
                    return Response({"detail": "Invalid question_id for this quiz"}, status=status.HTTP_400_BAD_REQUEST)

                question = Question.objects.get(id=question_id, quiz=quiz)
                option = get_object_or_404(Option, id=selected_option_id, question=question)

                Answer.objects.create(attempt=attempt, question=question, selected_option=option)

                if option.is_correct:
                    score += 1

            attempt.score = score
            attempt.save(update_fields=["score"])

        return Response({"score": score}, status=status.HTTP_200_OK)


class QuizHistoryView(APIView):
    def get(self, request):
        attempts = Attempt.objects.filter(user=request.user).select_related("quiz").order_by("-completed_at")
        return Response(AttemptSerializer(attempts, many=True).data, status=status.HTTP_200_OK)


class AttemptDetailView(APIView):
    def get(self, request, id: int):
        attempt = get_object_or_404(
            Attempt.objects.filter(user=request.user).select_related("quiz").prefetch_related("answers__question", "answers__selected_option"),
            id=id,
        )
        return Response(AttemptDetailSerializer(attempt).data, status=status.HTTP_200_OK)
