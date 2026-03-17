from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'area', 'is_active']
    list_filter = ['role', 'is_active', 'area']
    fieldsets = UserAdmin.fieldsets + (
        ('CivicAI Fields', {'fields': ('role', 'phone', 'area', 'avatar', 'address')}),
    )
