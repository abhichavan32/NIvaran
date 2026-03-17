"""
AI Engine for CivicAI
- Issue classification using keyword-based NLP
- Priority scoring
- Duplicate/similar issue detection
"""
import re
import math

# Category keywords for classification
CATEGORY_KEYWORDS = {
    'road': [
        'pothole', 'road', 'highway', 'street', 'pavement', 'crack', 'asphalt',
        'bridge', 'footpath', 'sidewalk', 'broken road', 'road damage', 'speed bump',
        'manhole', 'cover missing', 'uneven road', 'road repair'
    ],
    'garbage': [
        'garbage', 'waste', 'trash', 'litter', 'dump', 'rubbish', 'dustbin',
        'bin', 'smell', 'stink', 'dirty', 'debris', 'landfill', 'recycle',
        'waste collection', 'not collected', 'overflowing bin', 'dumping'
    ],
    'water': [
        'water', 'leak', 'pipe', 'drainage', 'flood', 'sewage', 'tap',
        'supply', 'contaminated', 'dirty water', 'no water', 'pipeline',
        'waterlogging', 'leakage', 'burst pipe', 'clogged drain', 'overflow'
    ],
    'electricity': [
        'electricity', 'power', 'streetlight', 'light', 'wire', 'pole',
        'outage', 'blackout', 'transformer', 'electric', 'bulb', 'lamp',
        'broken light', 'no power', 'voltage', 'short circuit', 'cable'
    ],
    'sanitation': [
        'toilet', 'bathroom', 'sanitation', 'hygiene', 'clean', 'disinfect',
        'public toilet', 'urinal', 'sewage', 'gutter', 'stagnant', 'mosquito'
    ],
    'noise': [
        'noise', 'loud', 'sound', 'music', 'honk', 'construction noise',
        'disturbance', 'speaker', 'generator', 'factory noise'
    ],
    'encroachment': [
        'encroachment', 'illegal', 'occupied', 'unauthorized', 'hawker',
        'vendor', 'blocked', 'footpath blocked', 'construction', 'land grab'
    ],
    'traffic': [
        'traffic', 'signal', 'jam', 'congestion', 'parking', 'accident',
        'zebra crossing', 'sign', 'divider', 'barricade', 'traffic light'
    ],
    'parks': [
        'park', 'garden', 'playground', 'bench', 'tree', 'green',
        'grass', 'public space', 'recreation', 'swing', 'slide'
    ],
}

# Severity keywords for priority scoring
HIGH_SEVERITY_KEYWORDS = [
    'urgent', 'emergency', 'dangerous', 'hazard', 'critical', 'severe',
    'accident', 'injury', 'death', 'collapse', 'fire', 'flood',
    'toxic', 'contaminated', 'children', 'school', 'hospital',
    'blocking', 'blocked', 'immediate', 'risk', 'unsafe'
]

MEDIUM_SEVERITY_KEYWORDS = [
    'broken', 'damaged', 'leaking', 'overflowing', 'not working',
    'complaint', 'problem', 'issue', 'bad', 'poor', 'terrible',
    'weeks', 'months', 'long time', 'repeated', 'multiple'
]


def classify_issue(text):
    """Classify issue into a category using keyword matching."""
    text_lower = text.lower()
    scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in text_lower:
                # Longer keyword matches get higher scores
                score += len(keyword.split())
        scores[category] = score

    if not scores or max(scores.values()) == 0:
        return 'other'

    return max(scores, key=scores.get)


def calculate_priority(text, upvote_count=0):
    """Calculate priority score (0-1) based on text analysis and upvotes."""
    text_lower = text.lower()
    score = 0.0

    # Severity keyword scoring
    high_count = sum(1 for kw in HIGH_SEVERITY_KEYWORDS if kw in text_lower)
    medium_count = sum(1 for kw in MEDIUM_SEVERITY_KEYWORDS if kw in text_lower)

    score += min(high_count * 0.15, 0.6)
    score += min(medium_count * 0.08, 0.3)

    # Upvote bonus (logarithmic scaling)
    if upvote_count > 0:
        score += min(math.log(upvote_count + 1) * 0.05, 0.2)

    # Text length bonus (longer descriptions may indicate more serious issues)
    word_count = len(text.split())
    if word_count > 50:
        score += 0.05
    if word_count > 100:
        score += 0.05

    return min(score, 1.0)


def recalculate_priority(issue):
    """Recalculate priority for an issue based on current state."""
    text = f"{issue.title} {issue.description}"
    score = calculate_priority(text, issue.upvote_count)
    issue.priority_score = score

    if score >= 0.75:
        issue.priority = 'critical'
    elif score >= 0.5:
        issue.priority = 'high'
    elif score >= 0.25:
        issue.priority = 'medium'
    else:
        issue.priority = 'low'

    issue.save()


def find_similar_issues(text, latitude=None, longitude=None, threshold=0.3):
    """Find similar issues based on keyword overlap and location proximity."""
    from issues.models import Issue

    text_lower = text.lower()
    text_words = set(re.findall(r'\b\w+\b', text_lower))
    # Remove common stop words
    stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on',
                  'at', 'to', 'for', 'of', 'and', 'or', 'but', 'not', 'with',
                  'this', 'that', 'it', 'i', 'my', 'our', 'there', 'has', 'have',
                  'been', 'be', 'do', 'does', 'did', 'will', 'would', 'could',
                  'should', 'may', 'can', 'please', 'near', 'here'}
    text_words -= stop_words

    if not text_words:
        return []

    similar = []
    # Only check active (non-resolved) issues
    issues = Issue.objects.exclude(status='resolved').order_by('-created_at')[:200]

    for issue in issues:
        issue_text = f"{issue.title} {issue.description}".lower()
        issue_words = set(re.findall(r'\b\w+\b', issue_text)) - stop_words

        if not issue_words:
            continue

        # Jaccard similarity
        intersection = text_words & issue_words
        union = text_words | issue_words
        text_similarity = len(intersection) / len(union) if union else 0

        # Location similarity
        location_bonus = 0
        if latitude and longitude and issue.latitude and issue.longitude:
            try:
                lat = float(latitude)
                lng = float(longitude)
                dist = haversine_distance(lat, lng, issue.latitude, issue.longitude)
                if dist < 0.5:  # Within 500 meters
                    location_bonus = 0.3
                elif dist < 1:  # Within 1 km
                    location_bonus = 0.15
                elif dist < 2:  # Within 2 km
                    location_bonus = 0.05
            except (ValueError, TypeError):
                pass

        combined_score = text_similarity + location_bonus

        if combined_score >= threshold:
            similar.append({
                'id': issue.id,
                'title': issue.title,
                'category': issue.category,
                'status': issue.status,
                'similarity_score': round(combined_score, 2),
                'address': issue.address,
                'upvote_count': issue.upvote_count,
                'created_at': issue.created_at.isoformat(),
            })

    # Sort by similarity score
    similar.sort(key=lambda x: x['similarity_score'], reverse=True)
    return similar[:5]


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km using Haversine formula."""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c
