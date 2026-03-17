from django.db import models
from django.conf import settings


class Issue(models.Model):
    CATEGORY_CHOICES = (
        ('road', 'Road & Pothole'),
        ('garbage', 'Garbage & Waste'),
        ('water', 'Water & Drainage'),
        ('electricity', 'Electricity & Streetlight'),
        ('sanitation', 'Sanitation & Hygiene'),
        ('noise', 'Noise Pollution'),
        ('encroachment', 'Encroachment'),
        ('traffic', 'Traffic & Signals'),
        ('parks', 'Parks & Public Spaces'),
        ('other', 'Other'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    ai_category = models.CharField(max_length=30, blank=True, null=True,
                                    help_text="AI-predicted category")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    priority_score = models.FloatField(default=0.0)

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reported_issues'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_issues'
    )

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    address = models.TextField(blank=True, null=True)

    image = models.ImageField(upload_to='issues/', blank=True, null=True)
    resolution_image = models.ImageField(upload_to='resolutions/', blank=True, null=True)
    resolution_notes = models.TextField(blank=True, null=True)

    upvote_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'issues'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title}"


class Comment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.issue.title}"


class Vote(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'votes'
        unique_together = ('issue', 'user')

    def __str__(self):
        return f"Vote by {self.user.username} on {self.issue.title}"
