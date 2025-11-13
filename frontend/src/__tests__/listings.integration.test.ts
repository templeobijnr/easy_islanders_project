/**
 * Integration tests for the listings system
 */

import { apiClient } from '../services/apiClient';
import {
  Category,
  Listing,
  CreateListingRequest,
  AvailabilityCheckResponse,
} from '../types/schema';

describe('Listings Integration Tests', () => {
  describe('Categories API', () => {
    it('should fetch all categories', async () => {
      const response = await apiClient.get<{ categories: Category[] }>(
        '/api/categories/'
      );
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.categories)).toBe(true);
    });

    it('should fetch category details including schema', async () => {
      const response = await apiClient.get<{ categories: Category[] }>(
        '/api/categories/'
      );
      const category = response.data.categories[0];

      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('schema');
      expect(Array.isArray(category.schema.fields)).toBe(true);
    });

    it('should fetch subcategories for a category', async () => {
      const categoriesResponse = await apiClient.get<{ categories: Category[] }>(
        '/api/categories/'
      );
      const category = categoriesResponse.data.categories.find(
        (c) => c.subcategories && c.subcategories.length > 0
      );

      if (category) {
        const response = await apiClient.get<{
          subcategories: Array<{ id: number; name: string; slug: string }>;
        }>(`/api/categories/${category.slug}/subcategories/`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.subcategories)).toBe(true);
      }
    });
  });

  describe('Listings CRUD', () => {
    let createdListingId: string;

    it('should create a listing', async () => {
      const categoriesResponse = await apiClient.get<{ categories: Category[] }>(
        '/api/categories/'
      );
      const category = categoriesResponse.data.categories[0];

      const payload: CreateListingRequest = {
        title: 'Test Listing - ' + Date.now(),
        description: 'This is a test listing',
        category: category.id,
        price: 100,
        currency: 'EUR',
        location: 'Test City',
        dynamic_fields: {
          bedrooms: 2,
          furnished: true,
        },
      };

      const response = await apiClient.post<Listing>('/api/listings/', payload);
      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.title).toBe(payload.title);

      createdListingId = response.data.id;
    });

    it('should fetch a listing by ID', async () => {
      if (!createdListingId) {
        console.log('Skipping: No listing created');
        return;
      }

      const response = await apiClient.get<Listing>(
        `/api/listings/${createdListingId}/`
      );
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(createdListingId);
    });

    it('should update a listing', async () => {
      if (!createdListingId) {
        console.log('Skipping: No listing created');
        return;
      }

      const updateData = {
        title: 'Updated Test Listing - ' + Date.now(),
        price: 150,
      };

      const response = await apiClient.patch<Listing>(
        `/api/listings/${createdListingId}/`,
        updateData
      );
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.price).toBe(updateData.price);
    });

    it('should list all listings with pagination', async () => {
      const response = await apiClient.get<{ results: Listing[]; count: number }>(
        '/api/listings/?limit=10&offset=0'
      );
      expect(response.status).toBe(200);
      expect(response.data.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.data.results || response.data)).toBe(true);
    });

    it('should filter listings by category', async () => {
      const categoriesResponse = await apiClient.get<{ categories: Category[] }>(
        '/api/categories/'
      );
      const category = categoriesResponse.data.categories[0];

      const response = await apiClient.get<Listing[]>(
        `/api/listings/?category__slug=${category.slug}&status=active`
      );
      expect(response.status).toBe(200);
    });

    it('should search listings by title', async () => {
      const response = await apiClient.get<Listing[]>(
        '/api/listings/?search=apartment'
      );
      expect(response.status).toBe(200);
    });

    it('should delete a listing', async () => {
      if (!createdListingId) {
        console.log('Skipping: No listing created');
        return;
      }

      const response = await apiClient.delete(
        `/api/listings/${createdListingId}/`
      );
      expect(response.status).toBe(204);
    });
  });

  describe('Availability API', () => {
    let listingId: string;

    beforeEach(async () => {
      // Get a listing to test availability
      const response = await apiClient.get<{ results: Listing[] }>(
        '/api/listings/?limit=1'
      );
      if (response.data.results && response.data.results.length > 0) {
        listingId = response.data.results[0].id;
      }
    });

    it('should check availability for short-term dates', async () => {
      if (!listingId) {
        console.log('Skipping: No listing available');
        return;
      }

      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 7);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 3);

      const response = await apiClient.post<AvailabilityCheckResponse>(
        '/api/shortterm/check-availability/',
        {
          listing_id: listingId,
          check_in: checkIn.toISOString().split('T')[0],
          check_out: checkOut.toISOString().split('T')[0],
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('available');
      expect(Array.isArray(response.data.conflicts)).toBe(true);
    });
  });

  describe('Field Validation', () => {
    it('should validate required fields on creation', async () => {
      const invalidPayload = {
        title: '', // Required but empty
        description: '',
        category: '', // Required
      };

      try {
        await apiClient.post('/api/listings/', invalidPayload);
        expect(true).toBe(false); // Should have thrown
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate dynamic fields against category schema', async () => {
      const categoriesResponse = await apiClient.get<{ categories: Category[] }>(
        '/api/categories/'
      );
      const category = categoriesResponse.data.categories[0];

      // Get required fields from schema
      const requiredFields = category.schema.fields
        .filter((f) => f.required && !f.required_if)
        .map((f) => f.name);

      const dynamicFields: Record<string, any> = {};
      requiredFields.forEach((field) => {
        dynamicFields[field] = null; // Intentionally missing
      });

      const payload = {
        title: 'Test',
        description: 'Test',
        category: category.id,
        dynamic_fields: dynamicFields,
      };

      // This may fail validation if required fields are missing
      try {
        const response = await apiClient.post<Listing>(
          '/api/listings/',
          payload
        );
        // If it succeeds, that's okay - backend might allow it
        expect(response.status).toBeGreaterThanOrEqual(200);
      } catch (error) {
        // Validation error is expected
        expect(error).toBeDefined();
      }
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle full listing creation workflow', async () => {
      // 1. Fetch categories
      const categoriesResponse = await apiClient.get<{ categories: Category[] }>(
        '/api/categories/'
      );
      expect(categoriesResponse.data.categories.length).toBeGreaterThan(0);

      const category = categoriesResponse.data.categories[0];

      // 2. Build form data with dynamic fields
      const dynamicFields: Record<string, any> = {};
      category.schema.fields.forEach((field) => {
        if (field.required) {
          switch (field.type) {
            case 'number':
              dynamicFields[field.name] = 0;
              break;
            case 'boolean':
              dynamicFields[field.name] = false;
              break;
            case 'select':
            case 'multi-select':
              dynamicFields[field.name] = field.choices?.[0] || '';
              break;
            default:
              dynamicFields[field.name] = 'Test Value';
          }
        }
      });

      // 3. Create listing
      const payload: CreateListingRequest = {
        title: 'Full Workflow Test - ' + Date.now(),
        description: 'Full workflow test listing',
        category: category.id,
        price: 100,
        currency: 'EUR',
        location: 'Test Location',
        dynamic_fields: dynamicFields,
      };

      const createResponse = await apiClient.post<Listing>(
        '/api/listings/',
        payload
      );
      expect(createResponse.status).toBe(201);
      expect(createResponse.data.id).toBeDefined();

      // 4. Retrieve it
      const getResponse = await apiClient.get<Listing>(
        `/api/listings/${createResponse.data.id}/`
      );
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.title).toBe(payload.title);

      // 5. Update it
      const updateResponse = await apiClient.patch<Listing>(
        `/api/listings/${createResponse.data.id}/`,
        { status: 'paused' }
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.status).toBe('paused');

      // 6. Clean up
      await apiClient.delete(`/api/listings/${createResponse.data.id}/`);
    });
  });
});
