from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    issue_title = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'message', 'issue', 'issue_title', 'is_read', 'created_at']

    def get_issue_title(self, obj):
        return obj.issue.title if obj.issue else None
