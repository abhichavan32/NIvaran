from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer,
    ChangePasswordSerializer, UserListSerializer
)

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'User registered successfully.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password updated successfully.'})


class UserListView(generics.ListAPIView):
    """List all users - Super Admin only."""
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['role', 'is_active', 'area']
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_queryset(self):
        if self.request.user.role != 'super_admin':
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual user - Super Admin only."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'super_admin':
            return User.objects.none()
        return User.objects.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class AreaAdminListView(generics.ListAPIView):
    """List all area admins."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role='area_admin', is_active=True)


class DashboardStatsView(APIView):
    """Dashboard statistics for super admin."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from issues.models import Issue

        if request.user.role not in ['super_admin', 'area_admin']:
            return Response({'error': 'Unauthorized'}, status=403)

        issues_qs = Issue.objects.all()
        if request.user.role == 'area_admin':
            issues_qs = issues_qs.filter(assigned_to=request.user)

        total = issues_qs.count()
        pending = issues_qs.filter(status='pending').count()
        in_progress = issues_qs.filter(status='in_progress').count()
        resolved = issues_qs.filter(status='resolved').count()

        # Category distribution
        from django.db.models import Count
        categories = list(
            issues_qs.values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Recent issues
        from issues.serializers import IssueListSerializer
        recent = issues_qs.order_by('-created_at')[:5]
        recent_data = IssueListSerializer(recent, many=True).data

        # Monthly trends (last 6 months)
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models.functions import TruncMonth

        six_months_ago = timezone.now() - timedelta(days=180)
        monthly = list(
            issues_qs.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        for m in monthly:
            m['month'] = m['month'].strftime('%Y-%m')

        resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0

        return Response({
            'total_issues': total,
            'pending': pending,
            'in_progress': in_progress,
            'resolved': resolved,
            'resolution_rate': resolution_rate,
            'categories': categories,
            'recent_issues': recent_data,
            'monthly_trends': monthly,
            'total_users': User.objects.filter(role='user').count(),
            'total_area_admins': User.objects.filter(role='area_admin').count(),
        })
