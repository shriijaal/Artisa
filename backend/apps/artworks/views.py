from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse, Http404

from apps.artworks.models import Artwork, ArtworkImage, Category, DigitalFile
from apps.artworks.serializers import (
    ArtworkSerializer,
    ArtworkCreateSerializer,
    ArtworkUpdateSerializer,
    ArtworkSubmitSerializer,
    CategorySerializer,
)
from apps.users.models import User
from apps.orders.models import OrderItem, Order


@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_artworks(request):
    if request.method == 'GET':
        artworks = Artwork.objects.filter(artist=request.user)
        serializer = ArtworkSerializer(artworks, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ArtworkCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            artwork = serializer.save()
            return Response(
                ArtworkSerializer(artwork).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def artwork_detail(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id, artist=request.user)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ArtworkSerializer(artwork)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if artwork.status != Artwork.Status.DRAFT:
            return Response(
                {'error': 'Can only edit draft artworks'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = ArtworkUpdateSerializer(artwork, data=request.data, partial=True)
        if serializer.is_valid():
            artwork = serializer.save()
            return Response(ArtworkSerializer(artwork).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if artwork.status != Artwork.Status.DRAFT:
            return Response(
                {'error': 'Can only delete draft artworks'},
                status=status.HTTP_400_BAD_REQUEST
            )
        artwork.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_artwork(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id, artist=request.user)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if artwork.status != Artwork.Status.DRAFT:
        return Response(
            {'error': 'Can only submit draft artworks'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = ArtworkSubmitSerializer(data=request.data)
    if serializer.is_valid():
        artwork.status = Artwork.Status.PENDING_REVIEW
        artwork.originality_confirmed = True
        artwork.save()
        return Response(ArtworkSerializer(artwork).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_artwork_image(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id, artist=request.user)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if artwork.status != Artwork.Status.DRAFT:
        return Response(
            {'error': 'Can only add images to draft artworks'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    image_file = request.FILES.get('image')
    is_primary = request.data.get('is_primary', 'false').lower() == 'true'
    
    if not image_file:
        return Response({'error': 'Image file required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # If this is the first image or marked as primary, make it primary
    if is_primary or artwork.images.count() == 0:
        artwork.images.update(is_primary=False)
    
    artwork_image = ArtworkImage.objects.create(
        artwork=artwork,
        image=image_file,
        is_primary=is_primary or artwork.images.count() == 0
    )
    
    return Response({'id': str(artwork_image.id)}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_artwork_image(request, artwork_id, image_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id, artist=request.user)
        artwork_image = ArtworkImage.objects.get(id=image_id, artwork=artwork)
    except (Artwork.DoesNotExist, ArtworkImage.DoesNotExist):
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if artwork.status != Artwork.Status.DRAFT:
        return Response(
            {'error': 'Can only delete images from draft artworks'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    artwork_image.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_primary_image(request, artwork_id, image_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id, artist=request.user)
        artwork_image = ArtworkImage.objects.get(id=image_id, artwork=artwork)
    except (Artwork.DoesNotExist, ArtworkImage.DoesNotExist):
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if artwork.status != Artwork.Status.DRAFT:
        return Response(
            {'error': 'Can only change primary image on draft artworks'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    artwork.images.update(is_primary=False)
    artwork_image.is_primary = True
    artwork_image.save()
    
    return Response(status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_digital_file(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id, artist=request.user)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if artwork.type != Artwork.Type.DIGITAL:
        return Response(
            {'error': 'Digital files can only be added to digital artworks'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if artwork.status != Artwork.Status.DRAFT:
        return Response(
            {'error': 'Can only add digital files to draft artworks'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES.get('file')
    preview_image = request.FILES.get('preview_image')
    
    if not file:
        return Response({'error': 'File required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Delete existing digital file if any
    DigitalFile.objects.filter(artwork=artwork).delete()
    
    digital_file = DigitalFile.objects.create(
        artwork=artwork,
        file=file,
        preview_image=preview_image
    )
    
    return Response({'id': str(digital_file.id)}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def published_artworks(request):
    artworks = Artwork.objects.filter(status=Artwork.Status.PUBLISHED)
    
    # Search
    search = request.query_params.get('search', '')
    if search:
        artworks = artworks.filter(
            title__icontains=search
        ) | artworks.filter(
            artist__username__icontains=search
        )
    
    # Filter by category
    category_id = request.query_params.get('category')
    if category_id:
        artworks = artworks.filter(category_id=category_id)
    
    # Filter by type
    artwork_type = request.query_params.get('type')
    if artwork_type:
        artworks = artworks.filter(type=artwork_type)
    
    # Filter by artist (username or artist id)
    artist_param = request.query_params.get('artist')
    if artist_param:
        artworks = artworks.filter(
            models.Q(artist__username__iexact=artist_param) | models.Q(artist__id__iexact=artist_param)
        )
    
    # Filter by verified artist
    verified_only = request.query_params.get('verified', 'false').lower() == 'true'
    if verified_only:
        artworks = artworks.filter(artist__artist_profile__verified_badge=True)
    
    # Filter by price range
    min_price = request.query_params.get('min_price')
    max_price = request.query_params.get('max_price')
    if min_price:
        artworks = artworks.filter(price__gte=float(min_price))
    if max_price:
        artworks = artworks.filter(price__lte=float(max_price))
    
    # Sort
    sort_by = request.query_params.get('sort', 'newest')
    if sort_by == 'newest':
        artworks = artworks.order_by('-created_at')
    elif sort_by == 'price_asc':
        artworks = artworks.order_by('price')
    elif sort_by == 'price_desc':
        artworks = artworks.order_by('-price')
    elif sort_by == 'rating':
        from django.db.models import Avg
        artworks = artworks.annotate(avg_rating=Avg('reviews__rating')).order_by('-avg_rating')
    
    serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([AllowAny])
def artwork_detail_public(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id, status=Artwork.Status.PUBLISHED)
        
        # Log view interaction for authenticated users
        if request.user.is_authenticated:
            from apps.recs.utils import log_interaction
            log_interaction(
                user=request.user,
                target_type='artwork',
                target_id=artwork_id,
                interaction_type='view',
            )
        
        serializer = ArtworkSerializer(artwork)
        return Response(serializer.data)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_digital_file(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if artwork.type != Artwork.Type.DIGITAL:
        return Response({'error': 'Artwork is not digital'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        digital_file = artwork.digital_file
    except DigitalFile.DoesNotExist:
        return Response({'error': 'Digital file not found'}, status=status.HTTP_404_NOT_FOUND)
        
    # Check permissions
    is_owner = (artwork.artist == request.user)
    
    has_purchased = OrderItem.objects.filter(
        artwork=artwork,
        order__customer=request.user,
        order__payment_status=Order.PaymentStatus.PAID
    ).exists()
    
    if not (is_owner or has_purchased):
        return Response({'error': 'Unauthorized to download this file. Purchase required.'}, status=status.HTTP_403_FORBIDDEN)
        
    if not digital_file.file:
        raise Http404("File not found on server")
        
    # Increment download count
    digital_file.download_count += 1
    digital_file.save(update_fields=['download_count'])
    
    # Serve the file
    try:
        file_handle = digital_file.file.open('rb')
        response = FileResponse(file_handle, as_attachment=True, filename=digital_file.file.name.split('/')[-1])
        return response
    except Exception as e:
        return Response({'error': 'Error reading file on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

