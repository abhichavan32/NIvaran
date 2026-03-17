from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from .models import Issue, Comment, Vote
from .serializers import (
    IssueListSerializer, IssueDetailSerializer,
    IssueCreateSerializer, IssueUpdateSerializer, CommentSerializer
)


class IssueListView(generics.ListAPIView):
    """List all issues with filtering, search, and ordering."""
    serializer_class = IssueListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'priority', 'reporter']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['created_at', 'upvote_count', 'priority_score']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Issue.objects.all()

        # Filter by assigned_to for area admins
        assigned = self.request.query_params.get('assigned_to')
        if assigned:
            queryset = queryset.filter(assigned_to_id=assigned)

        # Filter by area admin's own issues
        my_assigned = self.request.query_params.get('my_assigned')
        if my_assigned and self.request.user.is_authenticated:
            queryset = queryset.filter(assigned_to=self.request.user)

        # Filter by reporter's own issues
        my_issues = self.request.query_params.get('my_issues')
        if my_issues and self.request.user.is_authenticated:
            queryset = queryset.filter(reporter=self.request.user)

        return queryset


class IssueCreateView(generics.CreateAPIView):
    """Create a new issue."""
    serializer_class = IssueCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = serializer.save()
        return Response(
            IssueDetailSerializer(issue, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class IssueDetailView(generics.RetrieveAPIView):
    """Get issue details."""
    serializer_class = IssueDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Issue.objects.all()


class IssueUpdateView(generics.UpdateAPIView):
    """Update issue status / assignment. For admins."""
    serializer_class = IssueUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Issue.objects.all()
        elif user.role == 'area_admin':
            return Issue.objects.filter(assigned_to=user)
        return Issue.objects.filter(reporter=user)


class IssueDeleteView(generics.DestroyAPIView):
    """Delete issue. Super admin only."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'super_admin':
            return Issue.objects.all()
        return Issue.objects.none()


class VoteIssueView(APIView):
    """Upvote / remove upvote from an issue."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'error': 'Issue not found'}, status=404)

        vote, created = Vote.objects.get_or_create(issue=issue, user=request.user)
        if not created:
            vote.delete()
            issue.upvote_count = max(0, issue.upvote_count - 1)
            issue.save()
            return Response({'message': 'Vote removed', 'upvote_count': issue.upvote_count})

        issue.upvote_count += 1
        issue.save()

        # Recalculate priority based on upvotes
        from ai_engine.classifier import recalculate_priority
        recalculate_priority(issue)

        return Response({'message': 'Voted', 'upvote_count': issue.upvote_count})


class CommentListCreateView(generics.ListCreateAPIView):
    """List and create comments for an issue."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(issue_id=self.kwargs['issue_pk'])

    def perform_create(self, serializer):
        issue = Issue.objects.get(pk=self.kwargs['issue_pk'])
        comment = serializer.save(user=self.request.user, issue=issue)

        # Notify issue reporter
        if issue.reporter != self.request.user:
            from notifications.models import Notification
            Notification.objects.create(
                user=issue.reporter,
                message=f"{self.request.user.username} commented on your issue '{issue.title}'.",
                issue=issue
            )


class AssignIssueView(APIView):
    """Assign issue to an area admin. Super admin only."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'error': 'Issue not found'}, status=404)

        admin_id = request.data.get('admin_id')
        if not admin_id:
            return Response({'error': 'admin_id required'}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            admin = User.objects.get(pk=admin_id, role='area_admin')
        except User.DoesNotExist:
            return Response({'error': 'Area admin not found'}, status=404)

        issue.assigned_to = admin
        issue.status = 'in_progress'
        issue.save()

        # Notifications
        from notifications.models import Notification
        Notification.objects.create(
            user=admin,
            message=f"Issue '{issue.title}' has been assigned to you.",
            issue=issue
        )
        Notification.objects.create(
            user=issue.reporter,
            message=f"Your issue '{issue.title}' has been assigned to an area admin.",
            issue=issue
        )

        return Response(IssueDetailSerializer(issue, context={'request': request}).data)


class MapIssuesView(APIView):
    """Get all issues with coordinates for map view."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        issues = Issue.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False
        ).values(
            'id', 'title', 'category', 'status', 'priority',
            'latitude', 'longitude', 'address', 'upvote_count', 'created_at'
        )
        return Response(list(issues))


class SimilarIssuesView(APIView):
    """Find similar/duplicate issues using AI."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')

        if not title and not description:
            return Response({'similar_issues': []})

        from ai_engine.classifier import find_similar_issues
        similar = find_similar_issues(f"{title} {description}", lat, lng)
        return Response({'similar_issues': similar})


class ChatbotView(APIView):
    """Simple chatbot assistant for helping users report issues."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'reply': 'Please type a message.'})

        from ai_engine.chatbot import get_chatbot_response
        reply = get_chatbot_response(message)
        return Response({'reply': reply})


class ExportIssuesView(APIView):
    """Export issues as CSV."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'area_admin']:
            return Response({'error': 'Unauthorized'}, status=403)

        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="issues_report.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Title', 'Category', 'Status', 'Priority',
            'Reporter', 'Assigned To', 'Address',
            'Upvotes', 'Created At', 'Resolved At'
        ])

        issues = Issue.objects.all()
        if request.user.role == 'area_admin':
            issues = issues.filter(assigned_to=request.user)

        for issue in issues:
            writer.writerow([
                issue.id, issue.title, issue.get_category_display(),
                issue.get_status_display(), issue.get_priority_display(),
                issue.reporter.username,
                issue.assigned_to.username if issue.assigned_to else 'Unassigned',
                issue.address or '',
                issue.upvote_count,
                issue.created_at.strftime('%Y-%m-%d %H:%M'),
                issue.resolved_at.strftime('%Y-%m-%d %H:%M') if issue.resolved_at else ''
            ])

        return response
