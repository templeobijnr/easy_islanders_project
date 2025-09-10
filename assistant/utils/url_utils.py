from typing import List


def normalize_media_url(url: str) -> str:
    """Normalize listing media URLs to resolvable API paths.

    Rules:
    - Absolute http(s) URLs are returned unchanged
    - "/media/..." is returned unchanged (served by Django in DEBUG or storage)
    - Legacy "/listings/<id>/media/<filename>" is converted to
      "/api/listings/<id>/media/<filename>"
    - Everything else is returned as-is
    """
    if not url:
        return url
    u = str(url).strip()
    if u.startswith("http://") or u.startswith("https://"):
        return u
    if u.startswith("/media/"):
        # Only accept listing-scoped media; drop placeholders like "/media/test.jpg"
        if u.startswith("/media/listings/"):
            return u
        return ""
    if u.startswith("/listings/"):
        parts = u.strip("/").split("/")
        # expect: ['listings', '<id>', 'media', '<filename>']
        if len(parts) >= 4 and parts[0] == "listings" and parts[2] == "media":
            listing_id = parts[1]
            filename = parts[3]
            return f"/api/listings/{listing_id}/media/{filename}"
    return u


def normalize_image_list(urls: List[str]) -> List[str]:
    return [v for v in (normalize_media_url(u) for u in (urls or [])) if v]
