import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.artworks.models import Artwork
from apps.orders.models import Order, OrderItem
from apps.reviews.models import Review

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed completed orders and reviews for testing Task 17'

    def handle(self, *args, **options):
        self.stdout.write('Seeding orders and reviews...')

        buyers = list(User.objects.filter(username__startswith='buyer')[:5])
        if not buyers:
            self.stdout.write(self.style.ERROR('No buyers found. Run seed_demo_data first.'))
            return

        artworks = list(Artwork.objects.filter(status='published')[:20])
        if not artworks:
            self.stdout.write(self.style.ERROR('No published artworks found. Run seed_demo_data first.'))
            return

        reviews_created = 0
        orders_created = 0

        for buyer in buyers:
            num_orders = random.randint(2, 4)
            order_artworks = random.sample(artworks, min(num_orders, len(artworks)))

            for artwork in order_artworks:
                order = Order.objects.create(
                    customer=buyer,
                    subtotal=artwork.price,
                    shipping_cost=Decimal('100.00'),
                    total=artwork.price + Decimal('100.00'),
                    status='completed',
                    payment_status='paid',
                )

                item = OrderItem.objects.create(
                    order=order,
                    artwork=artwork,
                    artist=artwork.artist,
                    price=artwork.price,
                    quantity=1,
                )
                orders_created += 1

                if random.random() < 0.7:
                    rating = random.choices([3, 4, 5], weights=[10, 40, 50])[0]
                    comments = [
                        'Amazing artwork! The colors are even more vibrant in person.',
                        'Beautiful piece, exactly as described. Fast shipping too!',
                        'Love it! This is now the centerpiece of my living room.',
                        'Great quality and attention to detail. Highly recommend this artist.',
                        'Stunning work of art. The artist captured the mood perfectly.',
                        'Exactly what I was looking for. Will definitely buy from this artist again.',
                        'The craftsmanship is outstanding. Very happy with my purchase.',
                        'Beautiful painting that brings so much warmth to my space.',
                        'Incredible detail and quality. Worth every rupee!',
                        'This artwork exceeded my expectations. Absolutely gorgeous.',
                        'Love the style and colors. Perfect addition to my collection.',
                        'The artist has real talent. This piece is a masterpiece.',
                    ]
                    Review.objects.create(
                        reviewer=buyer,
                        order_item=item,
                        artwork=artwork,
                        artist=artwork.artist,
                        rating=rating,
                        comment=random.choice(comments),
                    )
                    reviews_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Created {orders_created} completed orders and {reviews_created} reviews'
        ))
