import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../../hooks/useCategories';
import { useListings } from '../../../hooks/useListings';
import DynamicListingForm from '../components/DynamicListingForm';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Card } from '../../../components/ui/card';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { createListing, isLoading: creatingListing, error: createError } = useListings();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    currency: 'EUR',
  });
  const [error, setError] = useState<string | null>(null);

  const category = categories.find(c => c.id === selectedCategory);

  const handleBasicInfoChange = (field: string, value: any) => {
    setListingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDynamicFieldsSubmit = async (dynamicFields: Record<string, any>) => {
    if (!selectedCategory || !category) {
      setError('Please select a category');
      return;
    }

    if (!listingData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!listingData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      setError(null);
      const newListing = await createListing({
        category: selectedCategory,
        subcategory: undefined, // TODO: Add subcategory selection
        title: listingData.title,
        description: listingData.description,
        price: listingData.price ? parseFloat(listingData.price) : undefined,
        currency: listingData.currency,
        location: listingData.location,
        dynamic_fields: dynamicFields,
        status: 'active',
      });

      // Redirect to listing detail or list
      navigate(`/listings/${newListing.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create listing';
      setError(message);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading categories...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">No categories available</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Category Selection */}
        <div className="col-span-1">
          <h2 className="text-lg font-semibold mb-4">Category</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setError(null);
                }}
                className={`
                  w-full p-3 rounded-lg border-2 transition-all
                  ${
                    selectedCategory === cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="text-left">
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-gray-500">
                      {cat.subcategories?.length || 0} subcategories
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="col-span-2">
          {selectedCategory && category ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">{category.name} Listing Details</h2>

              {/* Basic Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={listingData.title}
                    onChange={e => handleBasicInfoChange('title', e.target.value)}
                    placeholder="Enter listing title"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    value={listingData.description}
                    onChange={e => handleBasicInfoChange('description', e.target.value)}
                    placeholder="Enter detailed description"
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (optional)</label>
                    <input
                      type="number"
                      value={listingData.price}
                      onChange={e => handleBasicInfoChange('price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Currency</label>
                    <select
                      value={listingData.currency}
                      onChange={e => handleBasicInfoChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EUR">EUR €</option>
                      <option value="USD">USD $</option>
                      <option value="GBP">GBP £</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location (optional)</label>
                  <input
                    type="text"
                    value={listingData.location}
                    onChange={e => handleBasicInfoChange('location', e.target.value)}
                    placeholder="Enter location"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Form */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">{category.name} Specific Fields</h3>
                <DynamicListingForm
                  category={category}
                  onSubmit={handleDynamicFieldsSubmit}
                  isLoading={creatingListing}
                />
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p>Select a category to begin creating your listing</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateListingPage;
