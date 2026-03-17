from django.urls import path
from . import views

urlpatterns = [
    path('', views.IssueListView.as_view(), name='issue_list'),
    path('create/', views.IssueCreateView.as_view(), name='issue_create'),
    path('<int:pk>/', views.IssueDetailView.as_view(), name='issue_detail'),
    path('<int:pk>/update/', views.IssueUpdateView.as_view(), name='issue_update'),
    path('<int:pk>/delete/', views.IssueDeleteView.as_view(), name='issue_delete'),
    path('<int:pk>/vote/', views.VoteIssueView.as_view(), name='issue_vote'),
    path('<int:pk>/assign/', views.AssignIssueView.as_view(), name='issue_assign'),
    path('<int:issue_pk>/comments/', views.CommentListCreateView.as_view(), name='issue_comments'),
    path('map/', views.MapIssuesView.as_view(), name='issues_map'),
    path('similar/', views.SimilarIssuesView.as_view(), name='similar_issues'),
    path('chatbot/', views.ChatbotView.as_view(), name='chatbot'),
    path('export/', views.ExportIssuesView.as_view(), name='export_issues'),
]
