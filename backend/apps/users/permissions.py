from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsApprovedArtist(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has an artist_profile with approved status
        # This will be implemented when artist_profile model is created in Task 4
        # For now, return False until artist_profile exists
        try:
            return hasattr(request.user, 'artist_profile') and request.user.artist_profile.status == 'approved'
        except AttributeError:
            return False
