"""
Attach placeholder digital files to digital artworks that are missing one,
so paid orders can download immediately.

Run with: python manage.py ensure_digital_files
"""
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.artworks.models import Artwork, ArtworkImage, DigitalFile


def _placeholder_pdf(title: str) -> bytes:
    # Minimal valid one-page PDF with the artwork title in the metadata
    safe_title = title.replace('(', '').replace(')', '').replace('\\', '')[:80]
    content = (
        b"%PDF-1.4\n"
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n"
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
        b"4 0 obj<< /Length 78 >>stream\n"
        b"BT /F1 18 Tf 72 720 Td (Digital artwork file - Artisa) Tj ET\n"
        b"endstream\nendobj\n"
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
        + f"xref\n0 6\n0000000000 65535 f \n".encode()
        + b"trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n"
    )
    # Embed title as PDF Info for traceability
    info = f"\n% Title: {safe_title}\n".encode()
    return content + info


def _primary_image_path(artwork) -> str | None:
    img = artwork.images.filter(is_primary=True).first() or artwork.images.first()
    if img and img.image:
        return img.image.path
    return None


class Command(BaseCommand):
    help = 'Create placeholder DigitalFile rows for digital artworks missing a file.'

    def handle(self, *args, **options):
        missing = (
            Artwork.objects.filter(type=Artwork.Type.DIGITAL)
            .exclude(id__in=DigitalFile.objects.values_list('artwork_id', flat=True))
            .prefetch_related('images')
        )
        total = missing.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('All digital artworks already have a digital file.'))
            return

        created = 0
        skipped = 0
        for artwork in missing:
            # Prefer primary image as downloadable payload when present (real content for buyers)
            image_path = _primary_image_path(artwork)
            if image_path:
                try:
                    with open(image_path, 'rb') as fh:
                        data = fh.read()
                    ext = image_path.rsplit('.', 1)[-1].lower() or 'jpg'
                    filename = f'{artwork.id}_placeholder.{ext}'
                except OSError:
                    data = _placeholder_pdf(artwork.title)
                    filename = f'{artwork.id}_placeholder.pdf'
            else:
                data = _placeholder_pdf(artwork.title)
                filename = f'{artwork.id}_placeholder.pdf'

            DigitalFile.objects.create(
                artwork=artwork,
                file=ContentFile(BytesIO(data).getvalue(), name=filename),
            )
            created += 1
            self.stdout.write(f'  + {artwork.title} ({artwork.id})')

        self.stdout.write(
            self.style.SUCCESS(
                f'Done: {created} digital file(s) created ({total} were missing, {skipped} skipped).'
            )
        )
