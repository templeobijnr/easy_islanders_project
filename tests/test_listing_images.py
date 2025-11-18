import shutil
import tempfile
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from listings.models import Category, Listing, ListingImage


def make_test_image(name: str = "test.png") -> SimpleUploadedFile:
    """Return a tiny valid PNG blob for upload tests."""
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc``\x00"
        b"\x00\x00\x04\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    return SimpleUploadedFile(name, png_bytes, content_type="image/png")


class ListingImageUploadTests(TestCase):
    """Ensures the listing image upload endpoint persists files and metadata."""

    def setUp(self) -> None:
        super().setUp()
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="owner",
            email="owner@example.com",
            password="supersecret",
        )
        self.client.force_authenticate(self.user)

        self.category = Category.objects.create(
            slug="real-estate",
            name="Real Estate",
            is_featured_category=True,
        )
        self.listing = Listing.objects.create(
            owner=self.user,
            category=self.category,
            domain="real-estate",
            title="Waterfront Villa",
            description="A great listing for tests.",
            price=Decimal("100000.00"),
        )

        self._media_root = tempfile.mkdtemp(prefix="test-media-")
        self.addCleanup(shutil.rmtree, self._media_root)
        self.override = override_settings(MEDIA_ROOT=self._media_root)
        self.override.enable()
        self.addCleanup(self.override.disable)

    def test_upload_image_creates_listing_image_record(self) -> None:
        url = reverse("listings:listing-upload-image", args=[str(self.listing.id)])

        response = self.client.post(
            url,
            data={"image": make_test_image()},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ListingImage.objects.filter(listing=self.listing).count(), 1)
        created = ListingImage.objects.first()
        self.assertTrue(created.image.name.startswith("listing_images/"))
        # Ensure the API returns the serialized record so the UI can use it immediately.
        self.assertIn("image", response.data)
        self.assertTrue(response.data["image"])

    def test_upload_image_without_file_returns_400(self) -> None:
        url = reverse("listings:listing-upload-image", args=[str(self.listing.id)])

        response = self.client.post(url, data={}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "No image provided")
        self.assertEqual(ListingImage.objects.count(), 0)

    def test_images_endpoint_returns_all_uploaded_images(self) -> None:
        ListingImage.objects.create(listing=self.listing, image=make_test_image("one.png"))
        ListingImage.objects.create(listing=self.listing, image=make_test_image("two.png"))

        url = reverse("listings:listing-images", args=[str(self.listing.id)])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(payload["listing_id"], str(self.listing.id))
        self.assertEqual(payload["image_count"], 2)
        self.assertEqual(len(payload["image_urls"]), 2)
        self.assertTrue(all(url for url in payload["image_urls"]))
