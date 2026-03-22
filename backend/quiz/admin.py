from django.contrib import admin

from quiz.models import Answer, Attempt, Option, Question, Quiz

admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Option)
admin.site.register(Attempt)
admin.site.register(Answer)
