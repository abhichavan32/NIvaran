from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Issue, Comment, Vote

User = get_user_model()


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'issue', 'user', 'username', 'user_role', 'text', 'created_at']
        read_only_fields = ['id', 'user', 'username', 'user_role', 'created_at']


class IssueListSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'category', 'ai_category',
            'status', 'priority', 'priority_score',
            'reporter', 'reporter_name', 'assigned_to', 'assigned_to_name',
            'latitude', 'longitude', 'address', 'image',
            'upvote_count', 'comments_count', 'has_voted',
            'created_at', 'updated_at', 'resolved_at'
        ]

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else None

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False


class IssueDetailSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'category', 'ai_category',
            'status', 'priority', 'priority_score',
            'reporter', 'reporter_name', 'assigned_to', 'assigned_to_name',
            'latitude', 'longitude', 'address',
            'image', 'resolution_image', 'resolution_notes',
            'upvote_count', 'comments', 'has_voted',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'reporter', 'upvote_count', 'priority_score',
                           'ai_category', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else None

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False


class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = [
            'title', 'description', 'category',
            'latitude', 'longitude', 'address', 'image'
        ]

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user

        # AI classification
        from ai_engine.classifier import classify_issue, calculate_priority
        text = f"{validated_data.get('title', '')} {validated_data.get('description', '')}"
        ai_cat = classify_issue(text)
        validated_data['ai_category'] = ai_cat

        # If no category specified, use AI prediction
        if not validated_data.get('category') or validated_data['category'] == 'other':
            validated_data['category'] = ai_cat

        # Calculate priority
        priority_score = calculate_priority(text)
        validated_data['priority_score'] = priority_score
        if priority_score >= 0.75:
            validated_data['priority'] = 'critical'
        elif priority_score >= 0.5:
            validated_data['priority'] = 'high'
        elif priority_score >= 0.25:
            validated_data['priority'] = 'medium'
        else:
            validated_data['priority'] = 'low'

        issue = Issue.objects.create(**validated_data)

        # Create notification
        from notifications.models import Notification
        Notification.objects.create(
            user=issue.reporter,
            message=f"Your issue '{issue.title}' has been submitted successfully.",
            issue=issue
        )

        return issue


class IssueUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['status', 'assigned_to', 'resolution_notes', 'resolution_image', 'priority']

    def update(self, instance, validated_data):
        old_status = instance.status
        instance = super().update(instance, validated_data)

        # If status changed, send notification
        if 'status' in validated_data and validated_data['status'] != old_status:
            from notifications.models import Notification
            from django.utils import timezone

            if validated_data['status'] == 'resolved':
                instance.resolved_at = timezone.now()
                instance.save()

            Notification.objects.create(
                user=instance.reporter,
                message=f"Your issue '{instance.title}' status changed to {instance.get_status_display()}.",
                issue=instance
            )

        return instance
