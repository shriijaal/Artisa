import os
from io import BytesIO
from PIL import Image

from django.core.files.base import ContentFile


def validate_image_file(file):
    """Validate image file using Pillow and size limits."""
    # Check file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size > max_size:
        raise ValueError(f"File size exceeds maximum of 5MB")
    
    # Check file type using Pillow
    file.seek(0)
    try:
        image = Image.open(file)
        image.verify()
        file.seek(0)
        
        # Check if format is allowed
        allowed_formats = ['JPEG', 'PNG', 'GIF', 'WEBP']
        if image.format not in allowed_formats:
            raise ValueError(f"Invalid image type: {image.format}")
        
        file.seek(0)
        return True
    except Exception as e:
        raise ValueError(f"Invalid image file: {str(e)}")


def generate_thumbnails(image_field, sizes={'thumbnail': (150, 150), 'display': (800, 800)}):
    """Generate thumbnails for uploaded images."""
    if not image_field:
        return None
    
    image = Image.open(image_field)
    image_format = image.format
    
    thumbnails = {}
    
    for name, size in sizes.items():
        # Create a copy to avoid modifying original
        img_copy = image.copy()
        img_copy.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save to BytesIO
        thumb_io = BytesIO()
        img_copy.save(thumb_io, format=image_format, quality=85)
        thumb_io.seek(0)
        
        # Create filename
        filename = os.path.splitext(image_field.name)[0]
        thumb_filename = f"{filename}_{name}.{image_format.lower()}"
        
        thumbnails[name] = ContentFile(thumb_io.read(), name=thumb_filename)
    
    return thumbnails


def validate_file_type(file, allowed_types=['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']):
    """Validate file type using MIME type."""
    if hasattr(file, 'content_type'):
        if file.content_type not in allowed_types:
            raise ValueError(f"Invalid file type: {file.content_type}")
    return True
