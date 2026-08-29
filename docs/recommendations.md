# Recommendation System Documentation

**Artisa E-Commerce Platform**

---

## Overview

The Artisa platform uses a hybrid recommendation system combining content-based filtering (CBF) and collaborative filtering (CF) to provide personalized artwork and artist recommendations to users.

---

## Goals

1. **Increase Engagement** - Help users discover relevant artworks and artists
2. **Support Artists** - Promote artists to interested customers
3. **Drive Sales** - Recommend artworks likely to be purchased
4. **Cold-Start Safe** - Provide recommendations even for new users with no history

---

## What Gets Recommended

| Target | Where Shown | Signals Used |
|--------|-------------|--------------|
| Artworks | Homepage carousel, marketplace "For You", artwork detail "Similar works" | Views, favorites, cart adds, purchases, tags, category, price |
| Artists | Homepage "Artists you may like", artist profile "Similar artists" | Profile views, commissions, purchases, style overlap, category |

---

## Algorithm Architecture

### Hybrid Approach

The recommendation system uses a weighted hybrid approach:

```
final_score = α × CBF_score + (1 − α) × CF_score
```

Where:
- `α` = Content-based weight (default: 0.6)
- `CBF_score` = Content-based filtering score
- `CF_score` = Collaborative filtering score

### Phase Implementation

#### Phase A - Content-Based Filtering (Ship First)
- Cosine similarity on artwork features
- Popularity/trending fallback for guests and new users
- Features: tags, category, price band, artwork type

#### Phase B - Collaborative Filtering (Add When Data Exists)
- Item-based collaborative filtering from implicit feedback matrix
- User interaction matrix: views, favorites, cart adds, purchases
- Similar items based on user behavior patterns

#### Phase C - Evaluation (For University Report)
- Seed realistic interaction data via management command
- Measure Precision@K and Recall@K on seeded test set
- Click-through rate (CTR) in demo scenarios
- Before/after comparison: generic trending vs personalized
- Demo scenario: user browses category X → recs shift toward category X

---

## Content-Based Filtering (CBF)

### Feature Extraction

#### Artwork Features
```python
artwork_features = {
    'category': one_hot_encode(artwork.category),
    'tags': multi_hot_encode(artwork.tags),
    'price_band': discretize_price(artwork.price),
    'type': one_hot_encode(artwork.type),  # physical/digital
    'artist_style': extract_from_portfolio(artwork.artist)
}
```

#### Price Band Discretization
```python
def discretize_price(price_npr):
    if price_npr < 1000:
        return 'budget'
    elif price_npr < 5000:
        return 'mid_range'
    elif price_npr < 15000:
        return 'premium'
    else:
        return 'luxury'
```

#### Similarity Calculation
```python
from sklearn.metrics.pairwise import cosine_similarity

def calculate_cbf_similarity(target_artwork, candidate_artworks):
    target_vector = extract_features(target_artwork)
    candidate_vectors = [extract_features(a) for a in candidate_artworks]
    
    similarities = cosine_similarity([target_vector], candidate_vectors)
    return similarities[0]
```

### Artist Style Extraction
```python
def extract_artist_style(artist_id):
    artworks = Artwork.objects.filter(artist_id=artist_id, status='published')
    if not artworks:
        return default_style_vector
    
    # Aggregate features from artist's portfolio
    categories = [a.category for a in artworks]
    tags = [tag for a in artworks for tag in a.tags.all()]
    avg_price = sum(a.price for a in artworks) / len(artworks)
    
    return {
        'dominant_category': most_common(categories),
        'tag_distribution': tag_frequency(tags),
        'price_level': discretize_price(avg_price)
    }
```

---

## Collaborative Filtering (CF)

### Implicit Feedback Matrix

Build user-item interaction matrix:

```python
import numpy as np
from scipy.sparse import csr_matrix

def build_interaction_matrix():
    users = User.objects.all()
    artworks = Artwork.objects.filter(status='published')
    
    user_index = {user.id: idx for idx, user in enumerate(users)}
    artwork_index = {artwork.id: idx for idx, artwork in enumerate(artworks)}
    
    matrix = np.zeros((len(users), len(artworks)))
    
    for interaction in UserInteraction.objects.all():
        user_idx = user_index[interaction.user_id]
        artwork_idx = artwork_index[interaction.target_id]
        matrix[user_idx, artwork_idx] += interaction.weight
    
    return csr_matrix(matrix), user_index, artwork_index
```

### Interaction Weights

```python
INTERACTION_WEIGHTS = {
    'view': 1.0,
    'favorite': 3.0,
    'cart_add': 5.0,
    'purchase': 10.0,
    'commission': 8.0,
    'profile_view': 2.0
}
```

### Item-Based Collaborative Filtering

```python
from sklearn.metrics.pairwise import cosine_similarity

def calculate_item_similarity(interaction_matrix):
    # Calculate item-item similarity
    item_similarity = cosine_similarity(interaction_matrix.T)
    return item_similarity

def predict_user_preference(user_id, artwork_id, item_similarity, interaction_matrix):
    user_idx = user_index[user_id]
    artwork_idx = artwork_index[artwork_id]
    
    # Get user's interaction history
    user_interactions = interaction_matrix[user_idx]
    
    # Calculate weighted sum of similar items
    similar_items = item_similarity[artwork_idx]
    predicted_score = np.dot(user_interactions, similar_items)
    
    return predicted_score
```

---

## Hybrid Scoring

### Score Combination

```python
def calculate_hybrid_score(user_id, artwork_id, alpha=0.6):
    # Content-based score
    cbf_score = calculate_cbf_score(user_id, artwork_id)
    
    # Collaborative filtering score
    cf_score = calculate_cf_score(user_id, artwork_id)
    
    # Hybrid combination
    hybrid_score = alpha * cbf_score + (1 - alpha) * cf_score
    
    return hybrid_score
```

### Dynamic Alpha Adjustment

```python
def get_dynamic_alpha(user_id):
    interactions = UserInteraction.objects.filter(user_id=user_id).count()
    
    if interactions < 10:
        return 1.0  # Pure CBF for new users
    elif interactions < 50:
        return 0.8  # Mostly CBF
    elif interactions < 100:
        return 0.6  # Balanced
    else:
        return 0.4  # More CF for established users
```

---

## Caching Strategy

### Pre-computation

```python
# Management command
def compute_recommendations():
    for user in User.objects.all():
        artwork_recs = get_top_artwork_recommendations(user.id, k=20)
        artist_recs = get_top_artist_recommendations(user.id, k=10)
        
        cache, created = RecommendationCache.objects.get_or_create(
            user_id=user.id,
            target_type='artwork'
        )
        cache.target_ids = [r.id for r in artwork_recs]
        cache.computed_at = timezone.now()
        cache.save()
```

### Cache Invalidation

```python
def invalidate_user_cache(user_id):
    RecommendationCache.objects.filter(user_id=user_id).delete()

def invalidate_artwork_cache(artwork_id):
    # Invalidate caches for users who interacted with this artwork
    affected_users = UserInteraction.objects.filter(
        target_id=artwork_id,
        target_type='artwork'
    ).values_list('user_id', flat=True).distinct()
    
    RecommendationCache.objects.filter(user_id__in=affected_users).delete()
```

### Cache TTL

- **Artwork recommendations**: 24 hours
- **Artist recommendations**: 48 hours
- **Force refresh**: On significant user interaction (purchase, commission)

---

## API Endpoints

### Get Recommendations

```python
# GET /api/recommendations/artworks/
# GET /api/recommendations/artists/

class RecommendationView(APIView):
    def get(self, request, target_type):
        user_id = request.user.id if request.user.is_authenticated else None
        
        if user_id:
            # Get personalized recommendations
            cache = RecommendationCache.objects.filter(
                user_id=user_id,
                target_type=target_type
            ).first()
            
            if cache and cache.is_valid():
                target_ids = cache.target_ids
            else:
                # Compute fresh recommendations
                target_ids = compute_fresh_recommendations(user_id, target_type)
        else:
            # Get trending/popular for guests
            target_ids = get_trending_items(target_type)
        
        # Fetch and return items
        items = get_items_by_ids(target_type, target_ids)
        return Response(items)
```

### Log Interaction

```python
# POST /api/interactions/

class InteractionView(APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response(status=401)
        
        serializer = InteractionSerializer(data=request.data)
        if serializer.is_valid():
            interaction = serializer.save(user=request.user)
            
            # Invalidate cache if significant interaction
            if interaction.interaction_type in ['purchase', 'commission']:
                invalidate_user_cache(request.user.id)
            
            return Response(serializer.data, status=201)
        
        return Response(serializer.errors, status=400)
```

---

## Evaluation Metrics

### Precision@K

```python
def precision_at_k(recommended_items, relevant_items, k):
    recommended_k = recommended_items[:k]
    hits = len(set(recommended_k) & set(relevant_items))
    return hits / k
```

### Recall@K

```python
def recall_at_k(recommended_items, relevant_items, k):
    recommended_k = recommended_items[:k]
    hits = len(set(recommended_k) & set(relevant_items))
    return hits / len(relevant_items) if relevant_items else 0
```

### Click-Through Rate (CTR)

```python
def calculate_ctr(recommendations, clicks):
    total_recommendations = len(recommendations)
    total_clicks = sum(clicks)
    return total_clicks / total_recommendations if total_recommendations > 0 else 0
```

---

## Demo Scenarios

### Scenario 1: Cold Start (New User)

**Setup:**
- User registers, no interaction history
- System shows trending/popular artworks

**Expected Behavior:**
- Recommendations based on popularity and recency
- No personalization yet
- As user interacts, recommendations shift

### Scenario 2: Category Browsing

**Setup:**
- User browses "Landscape" category artworks
- Views several landscape paintings

**Expected Behavior:**
- Recommendations shift toward landscape paintings
- Similar artists who create landscapes promoted
- Price range based on viewed items

### Scenario 3: Purchase Behavior

**Setup:**
- User purchases artwork in "mid_range" price band
- User favors "digital" type artworks

**Expected Behavior:**
- Future recommendations prioritize digital artworks
- Price range around mid_range
- Similar digital artists promoted

### Scenario 4: Artist Discovery

**Setup:**
- User views artist profile multiple times
- User commissions work from artist

**Expected Behavior:**
- Similar artists recommended
- Artists with similar style promoted
- Artists in same category recommended

---

## Data Seeding

### Management Command

```python
# python manage.py seed_demo_data

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Create users
        users = create_test_users(100)
        
        # Create artists and artworks
        artists = create_test_artists(20)
        artworks = create_test_artworks(artists, 200)
        
        # Generate realistic interactions
        generate_interactions(users, artworks)
        
        # Compute initial recommendations
        compute_recommendations()
```

### Interaction Generation

```python
def generate_interactions(users, artworks):
    for user in users:
        # Each user views 10-50 random artworks
        viewed = random.sample(artworks, random.randint(10, 50))
        for artwork in viewed:
            UserInteraction.objects.create(
                user=user,
                target_type='artwork',
                target_id=artwork.id,
                interaction_type='view',
                weight=1.0
            )
        
        # 20% of users favorite items
        if random.random() < 0.2:
            favorites = random.sample(viewed, random.randint(1, 5))
            for artwork in favorites:
                UserInteraction.objects.create(
                    user=user,
                    target_type='artwork',
                    target_id=artwork.id,
                    interaction_type='favorite',
                    weight=3.0
                )
        
        # 10% of users add to cart
        if random.random() < 0.1:
            cart_items = random.sample(viewed, random.randint(1, 3))
            for artwork in cart_items:
                UserInteraction.objects.create(
                    user=user,
                    target_type='artwork',
                    target_id=artwork.id,
                    interaction_type='cart_add',
                    weight=5.0
                )
        
        # 5% of users purchase
        if random.random() < 0.05:
            purchases = random.sample(cart_items if 'cart_items' in locals() else viewed, 1)
            for artwork in purchases:
                UserInteraction.objects.create(
                    user=user,
                    target_type='artwork',
                    target_id=artwork.id,
                    interaction_type='purchase',
                    weight=10.0
                )
```

---

## Performance Optimization

### Database Indexes

```python
# Indexes for recommendation queries
class UserInteraction(models.Model):
    user = models.ForeignKey(User, db_index=True)
    target_type = models.CharField(max_length=20, db_index=True)
    target_id = models.UUIDField(db_index=True)
    interaction_type = models.CharField(max_length=20, db_index=True)
    weight = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'target_type', 'target_id']),
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['interaction_type', 'created_at']),
        ]
```

### Batch Processing

```python
def batch_compute_recommendations(batch_size=100):
    users = User.objects.all()
    
    for i in range(0, users.count(), batch_size):
        batch = users[i:i+batch_size]
        for user in batch:
            compute_user_recommendations(user.id)
```

### Rate Limiting

```python
# Prevent excessive interaction logging
from django.core.cache import cache
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='100/m')
def log_interaction(request):
    # Interaction logging logic
    pass
```

---

## Security Considerations

### Score Manipulation Prevention

- Rate limit interaction logging
- Weight verification for suspicious patterns
- IP-based rate limiting for guest views
- Detect and filter bot traffic

### Privacy

- User interaction data stored securely
- Recommendations computed server-side
- No exposure of other users' preferences
- GDPR compliance for data retention

---

## Future Enhancements

### Deep Learning
- Neural collaborative filtering
- Embedding-based recommendations
- Image similarity using CNNs

### Real-time Updates
- WebSocket for live recommendation updates
- Stream processing for interaction data
- Incremental model updates

### Advanced Features
- A/B testing framework
- Multi-armed bandit for exploration
- Context-aware recommendations (time, device, location)
- Cross-domain recommendations (artworks → artists → commissions)

---

## Monitoring

### Metrics to Track

- Recommendation cache hit rate
- Average recommendation computation time
- CTR on recommended items
- Conversion rate from recommendations
- User satisfaction (implicit feedback)

### Alerts

- Cache hit rate below threshold
- Computation time above threshold
- CTR significant drop
- System errors in recommendation pipeline

---

## Dependencies

```python
# requirements.txt additions
scikit-learn>=1.3.0
numpy>=1.24.0
pandas>=2.0.0
scipy>=1.10.0
django-ratelimit>=4.0.0
```

---

## Implementation Checklist

- [ ] Create UserInteraction model
- [ ] Create RecommendationCache model
- [ ] Implement CBF feature extraction
- [ ] Implement CF matrix building
- [ ] Implement hybrid scoring
- [ ] Create caching system
- [ ] Implement API endpoints
- [ ] Create management command for seeding
- [ ] Implement evaluation metrics
- [ ] Add performance monitoring
- [ ] Write unit tests
- [ ] Document API endpoints
