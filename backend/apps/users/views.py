from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.users.models import User, ArtistProfile, ArtistApplication, Favorite
from apps.users.serializers import (
    ArtistApplicationAdminSerializer,
    ArtistApplicationSerializer,
    ArtistProfileSerializer,
    ArtistProfileUpdateSerializer,
    CustomTokenObtainPairSerializer,
    FavoriteSerializer,
    RegisterSerializer,
    UserAvatarSerializer,
    UserSerializer,
)
from apps.core.email import (
    send_welcome_email,
    send_password_reset_email,
    send_artist_approved_email,
    send_artist_rejected_email,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        send_welcome_email(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'message': 'User registered successfully'
            },
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_str(user.pk).encode())
        
        # Send email with reset link
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"
        send_password_reset_email(user, reset_link)
        
        return Response({
            'message': 'Password reset link generated',
            'reset_link': reset_link  # Remove this in production
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'message': 'If email exists, a reset link has been sent'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not all([uid, token, new_password]):
        return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
    except (User.DoesNotExist, ValueError):
        return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def artist_application(request):
    if request.method == 'GET':
        try:
            application = ArtistApplication.objects.filter(user=request.user).first()
            if application:
                serializer = ArtistApplicationSerializer(application)
                return Response(serializer.data)
            return Response({'message': 'No application found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'POST':
        serializer = ArtistApplicationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            application = serializer.save()
            return Response(
                ArtistApplicationSerializer(application).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def artist_profile(request):
    try:
        profile = ArtistProfile.objects.get_or_create(user=request.user)[0]
        
        if request.method == 'GET':
            serializer = ArtistProfileSerializer(profile)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            serializer = ArtistProfileUpdateSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(ArtistProfileSerializer(profile).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    try:
        serializer = UserAvatarSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_artist_profile(request, username):
    try:
        user = User.objects.get(username__iexact=username)
        profile = ArtistProfile.objects.filter(user=user).first()
        
        if not profile or profile.status != ArtistProfile.Status.APPROVED:
            return Response({'error': 'Artist profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Log profile_view interaction for authenticated users
        if request.user.is_authenticated:
            from apps.recs.utils import log_interaction
            log_interaction(
                user=request.user,
                target_type='artist',
                target_id=user.id,
                interaction_type='profile_view',
            )

        serializer = ArtistProfileSerializer(profile)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def favorites(request):
    if request.method == 'GET':
        favorites = Favorite.objects.filter(user=request.user)
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        artwork_id = request.data.get('artwork_id')
        if not artwork_id:
            return Response({'error': 'artwork_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            artwork_id=artwork_id
        )
        
        if created:
            from apps.recs.utils import log_interaction
            log_interaction(
                user=request.user,
                target_type='artwork',
                target_id=artwork_id,
                interaction_type='favorite',
            )
            return Response(FavoriteSerializer(favorite).data, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Already in favorites'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_favorite(request, favorite_id):
    try:
        favorite = Favorite.objects.get(id=favorite_id, user=request.user)
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Favorite.DoesNotExist:
        return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_favorite_by_artwork(request, artwork_id):
    try:
        favorite = Favorite.objects.get(artwork_id=artwork_id, user=request.user)
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Favorite.DoesNotExist:
        return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_applications(request):
    if request.user.role != User.Role.ADMIN:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        applications = ArtistApplication.objects.all()
        serializer = ArtistApplicationAdminSerializer(applications, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ArtistApplicationAdminSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save()
            return Response(
                ArtistApplicationAdminSerializer(application).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_approve_application(request, application_id):
    if request.user.role != User.Role.ADMIN:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        application = ArtistApplication.objects.get(id=application_id)
        action = request.data.get('action')  # 'approve' or 'reject'
        rejection_reason = request.data.get('rejection_reason', '')
        
        if action == 'approve':
            application.status = ArtistApplication.Status.APPROVED
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
            application.save()
            
            # Create or update artist profile
            profile, created = ArtistProfile.objects.get_or_create(
                user=application.user,
                defaults={
                    'status': ArtistProfile.Status.APPROVED,
                    'verified_badge': True
                }
            )
            if not created:
                profile.status = ArtistProfile.Status.APPROVED
                profile.verified_badge = True
                profile.save()
            
            send_artist_approved_email(application.user)
            return Response({'message': 'Application approved'}, status=status.HTTP_200_OK)
        
        elif action == 'reject':
            application.status = ArtistApplication.Status.REJECTED
            application.rejection_reason = rejection_reason
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
            application.save()
            
            send_artist_rejected_email(application.user, rejection_reason)
            return Response({'message': 'Application rejected'}, status=status.HTTP_200_OK)
        
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    except ArtistApplication.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
