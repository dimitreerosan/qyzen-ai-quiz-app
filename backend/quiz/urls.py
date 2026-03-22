from django.urls import path

from quiz.views import AttemptDetailView, QuizDetailView, QuizGenerateView, QuizHistoryView, QuizSubmitView

urlpatterns = [
    path("generate/", QuizGenerateView.as_view(), name="quiz-generate"),
    path("submit/", QuizSubmitView.as_view(), name="quiz-submit"),
    path("history/", QuizHistoryView.as_view(), name="quiz-history"),
    path("attempt/<int:id>/", AttemptDetailView.as_view(), name="quiz-attempt-detail"),
    path("<int:id>/", QuizDetailView.as_view(), name="quiz-detail"),
]
