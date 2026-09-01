from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, ArtistProfile, ArtistApplication, Favorite
from apps.users.utils import validate_image_file, validate_file_type


class ArtistProfileSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistProfile
        fields = ('status', 'verified_badge')


class UserSerializer(serializers.ModelSerializer):
    artist_profile = ArtistProfileSummarySerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'avatar', 'artist_profile')
        read_only_fields = ('id', 'role', 'username')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        username = attrs.get('username', '')
        if username and '@' in username:
            try:
                user = User.objects.get(email__iexact=username)
                attrs['username'] = user.username
            except User.DoesNotExist:
                pass
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class ArtistProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ArtistProfile
        fields = ('id', 'user', 'bio', 'cover_image', 'social_links', 'status', 'verified_badge', 'created_at')
        read_only_fields = ('id', 'user', 'status', 'verified_badge', 'created_at')


class ArtistProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistProfile
        fields = ('bio', 'cover_image', 'social_links')

    def validate_cover_image(self, value):
        if value:
            validate_file_type(value)
            validate_image_file(value)
        return value


class UserAvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('avatar',)

    def validate_avatar(self, value):
        if value:
            validate_file_type(value)
            validate_image_file(value)
        return value


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ('id', 'artwork_id', 'created_at')
        read_only_fields = ('id', 'created_at')


class ArtistApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ArtistApplication
        fields = ('id', 'user', 'portfolio_samples', 'verification_document', 'reason', 'status', 'rejection_reason', 'reviewed_at')
        read_only_fields = ('id', 'user', 'status', 'rejection_reason', 'reviewed_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ArtistApplicationAdminSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ArtistApplication
        fields = ('id', 'user', 'user_id', 'portfolio_samples', 'verification_document', 'reason', 'status', 'rejection_reason', 'reviewed_by', 'reviewed_at')
        read_only_fields = ('id', 'user', 'reviewed_at')
