from django.contrib.auth import get_user_model
from rest_framework import serializers

from quiz.models import Answer, Attempt, Option, Question, Quiz


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        username = validated_data.get("username")
        email = validated_data.get("email", "")
        password = validated_data.get("password")

        user = User(username=username, email=email)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ("id", "text", "is_correct")


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "text", "options")


class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "topic", "difficulty", "time_limit_minutes", "created_at", "questions")


class QuizGenerateSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=255)
    number_of_questions = serializers.IntegerField(min_value=5, max_value=19)
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"])


class SubmitAnswerItemSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField()


class QuizSubmitSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    answers = SubmitAnswerItemSerializer(many=True)


class AttemptSerializer(serializers.ModelSerializer):
    quiz = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = ("id", "quiz", "score", "completed_at")

    def get_quiz(self, obj):
        return {
            "id": obj.quiz_id,
            "topic": obj.quiz.topic,
            "difficulty": obj.quiz.difficulty,
            "time_limit_minutes": obj.quiz.time_limit_minutes,
        }


class AttemptAnswerSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source="question.id", read_only=True)
    selected_option_id = serializers.IntegerField(source="selected_option.id", read_only=True)

    class Meta:
        model = Answer
        fields = ("question_id", "selected_option_id")


class AttemptDetailSerializer(serializers.ModelSerializer):
    quiz = serializers.SerializerMethodField()
    answers = AttemptAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Attempt
        fields = ("id", "quiz", "score", "completed_at", "answers")

    def get_quiz(self, obj):
        return {
            "id": obj.quiz_id,
            "topic": obj.quiz.topic,
            "difficulty": obj.quiz.difficulty,
            "time_limit_minutes": obj.quiz.time_limit_minutes,
        }
