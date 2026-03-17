from django.contrib import admin
from .models import Issue, Comment, Vote


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'priority', 'reporter', 'assigned_to', 'created_at']
    list_filter = ['category', 'status', 'priority']
    search_fields = ['title', 'description']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['issue', 'user', 'created_at']


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['issue', 'user', 'created_at']
