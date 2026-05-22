from typing import List, Optional, Dict, Any, Tuple
import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Returns distance in kilometers
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def _safe_get(d: Dict[str, Any], key: str, default=0.0):
    v = d.get(key, default)
    try:
        return float(v)
    except Exception:
        return default

def rank_bikes(
    bikes: List[Dict[str, Any]],
    user_location: Optional[Tuple[float, float]] = None,
    top_n: int = 5
) -> List[Dict[str, Any]]:
    """Rank bikes by a simple heuristic combining popularity, rating, proximity and price.

    Each bike dict may include: bike_id, lat, lon, price, rating, bookings_count
    """
    if not bikes:
        return []

    # Extract raw arrays
    prices = [_safe_get(b, 'price', 1.0) for b in bikes]
    ratings = [_safe_get(b, 'rating', 0.0) for b in bikes]
    pops = [_safe_get(b, 'bookings_count', 0.0) for b in bikes]

    # Normalization helpers (min-max)
    def normalize(arr):
        mi = min(arr) if arr else 0.0
        ma = max(arr) if arr else 1.0
        if ma - mi == 0:
            return [0.0 for _ in arr]
        return [(x - mi) / (ma - mi) for x in arr]

    norm_price = normalize(prices)
    norm_rating = normalize(ratings)
    norm_pop = normalize(pops)

    results = []
    for i, b in enumerate(bikes):
        score = 0.0
        # weights (can be tuned)
        w_pop = 0.4
        w_rating = 0.3
        w_proximity = 0.2
        w_price = 0.1

        score += w_pop * norm_pop[i]
        score += w_rating * norm_rating[i]

        if user_location and 'lat' in b and 'lon' in b:
            dist_km = haversine_distance(user_location[0], user_location[1], _safe_get(b, 'lat', 0.0), _safe_get(b, 'lon', 0.0))
            # closer = higher score -> invert and normalize by a reasonable cap (20km)
            proximity_score = max(0.0, 1.0 - min(dist_km, 20.0) / 20.0)
            score += w_proximity * proximity_score
        else:
            # no location info -> neutral
            score += w_proximity * 0.0

        # lower price is better
        score += w_price * (1.0 - norm_price[i])

        results.append({
            'bike_id': b.get('bike_id'),
            'score': float(round(score, 4)),
            'metadata': b
        })

    # sort by score desc
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:top_n]


def recommend_heuristic(request_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Wrapper that accepts the request JSON and returns recommendations.

    Expected keys: bikes (list), user_location (optional dict with lat/lon), top_n
    """
    bikes = request_json.get('bikes', [])
    loc = request_json.get('user_location')
    top_n = int(request_json.get('top_n', 5))
    user_loc = None
    if loc and isinstance(loc, dict) and 'lat' in loc and 'lon' in loc:
        user_loc = (float(loc['lat']), float(loc['lon']))

    return rank_bikes(bikes=bikes, user_location=user_loc, top_n=top_n)
