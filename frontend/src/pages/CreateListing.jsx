import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  ShoppingBag,
  Building2,
  Briefcase,
  ChevronRight,
  Upload,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Lock,
  UtensilsCrossed,
  Waves,
  Wrench,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import config from "../config";
import { CATEGORY_DESIGN } from "../lib/categoryDesign";

const CreateListingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "EUR",
    location: "",
    dynamic_fields: {},
  });

  const t = {
    selectCategory: "Select Category",
    selectSubcategory: "Select Subcategory",
    uploadPhotos: "Upload Photos",
    dragDrop: "Drag & drop or click to upload (max 10 images)",
    listingDetails: "Listing Details",
    title: "Title",
    titlePlaceholder: "Enter a descriptive title",
    description: "Description",
    descriptionPlaceholder: "Describe your listing in detail",
    price: "Price",
    pricePlaceholder: "Enter price",
    location: "Location",
    locationPlaceholder: "City or area",
    currency: "Currency",
    back: "Back",
    publish: "Publish Listing",
    creatingListing: "Creating listing...",
    success: "Listing created successfully!",
    pleaseLogin: "Please log in to create listings",
    businessAccountRequired: "Only Business accounts can create listings.",
    validationError: "Please fill in all required fields",
    maxImages: "Maximum 10 images allowed",
    error: "An error occurred. Please try again.",
    change: "Change",
    loadingCategories: "Loading categories...",
  };

  const categoryIconMap = {
    car_rental: Car,
    accommodation: Building2,
    activities: Sparkles,
    dining: UtensilsCrossed,
    beaches: Waves,
    products: ShoppingBag,
    vehicles: Car,
    services: Wrench,
    local_businesses: Briefcase,
    experiences: Sparkles,
    jobs: Briefcase,
    miscellaneous: ShoppingBag,
    real_estate: Building2,
    general: ShoppingBag,
  };

  // --- Fetch Categories ---
  useEffect(() => {
    console.log('CreateListing: useEffect triggered', { isAuthenticated, userType: user?.user_type });
    if (isAuthenticated && user?.user_type === "business") {
      console.log('CreateListing: User is business, calling fetchCategories');
      fetchCategories();
    } else {
      console.log('CreateListing: User not authenticated or not business type');
    }
  }, [isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      console.log('CreateListing: fetchCategories called');
      setCategoriesLoading(true);
      const apiUrl = `${config.API_BASE_URL}/api/categories/`;
      console.log('CreateListing: Making request to:', apiUrl);

      const response = await axios.get(apiUrl);
      console.log('CreateListing: Response received:', response);
      console.log('CreateListing: Response status:', response.status);
      console.log('CreateListing: Response data:', response.data);

      const categoriesData = response.data.categories || [];
      console.log('CreateListing: Extracted categories:', categoriesData.length, 'items');
      console.log('CreateListing: Categories details:', categoriesData);

      setCategories(categoriesData);
      console.log('CreateListing: Categories state updated');
    } catch (err) {
      console.error('CreateListing: fetchCategories error:', err);
      console.error('CreateListing: Error response:', err.response);
      setError("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
      console.log('CreateListing: Loading state set to false');
    }
  };

  // --- Fetch Subcategories ---
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.slug);
    }
  }, [selectedCategory]);

  const fetchSubcategories = async (slug) => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/categories/${slug}/subcategories/`
      );
      setSubcategories(response.data.subcategories || []);
    } catch (err) {
      setSubcategories([]);
    }
  };

  const handleCategorySelect = (category) => setSelectedCategory(category);

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setStep(2);
  };

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 10) {
      setError(t.maxImages);
      return;
    }
    const newImages = files.map((file) => URL.createObjectURL(file));
    setUploadedImages((prev) => [...prev, ...newImages]);
    setImageFiles((prev) => [...prev, ...files]);
    setError(null);
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.price.trim() ||
      !formData.location.trim()
    ) {
      setError(t.validationError);
      return false;
    }
    return true;
  };

  // --- Handle Submit ---
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const listingResponse = await axios.post(
        `${config.API_BASE_URL}/api/listings/`,
        {
          title: formData.title,
          description: formData.description,
          category: selectedCategory.slug,
          subcategory: selectedSubcategory?.slug,
          price: parseFloat(formData.price),
          currency: formData.currency,
          location: formData.location,
          dynamic_fields: formData.dynamic_fields,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const listingId = listingResponse.data.id;

      // Upload images
      for (const file of imageFiles) {
        const imageFormData = new FormData();
        imageFormData.append("image", file);
        await axios.post(
          `${config.API_BASE_URL}/api/listings/${listingId}/upload-image/`,
          imageFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate("/dashboard/my-listings"), 2000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || t.error);
    }
  };

  // --- Conditional Rendering for Auth ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center">
          <Lock className="w-16 h-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t.pleaseLogin}
          </h1>
          <p className="text-gray-500">
            You need to be logged in to create a new listing.
          </p>
        </div>
      </div>
    );
  }

  if (user?.user_type !== "business") {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center">
          <Briefcase className="w-16 h-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t.businessAccountRequired}
          </h1>
          <p className="text-gray-500">
            Switch to a business account to start selling.
          </p>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  console.log('CreateListing: Main render - categories:', categories.length, 'loading:', categoriesLoading);
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      {/* Debug Panel */}
      <div style={{
        position: 'fixed',
        top: '100px',
        right: '10px',
        background: 'red',
        color: 'white',
        padding: '10px',
        zIndex: 9999,
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <div>DEBUG INFO:</div>
        <div>Categories: {categories.length}</div>
        <div>Loading: {categoriesLoading ? 'true' : 'false'}</div>
        <div>API URL: {config.API_BASE_URL}</div>
        <div>Auth: {isAuthenticated ? 'true' : 'false'}</div>
        <div>User Type: {user?.user_type}</div>
        <div>Categories Data: {JSON.stringify(categories.slice(0, 2), null, 2)}</div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-300">{t.success}</p>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            {[1, 2].map((num) => (
              <React.Fragment key={num}>
                <div className={step >= num ? "text-brand" : "text-gray-400"}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= num ? "bg-brand text-white" : "bg-gray-200"
                    }`}
                  >
                    {num}
                  </div>
                </div>
                {num === 1 && (
                  <ChevronRight className="w-6 h-6 text-gray-300" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {t.selectCategory}
            </h2>
            {categoriesLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="mt-4 text-gray-600">{t.loadingCategories}</p>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8"
                >
                  {categories.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <p className="text-gray-500 text-lg">No categories found</p>
                    </div>
                  ) : (
                    categories.map((category, index) => {
                      const Icon = categoryIconMap[category.slug] || ShoppingBag;
                      const isSelected = selectedCategory?.id === category.id;
                      const design = CATEGORY_DESIGN[category.slug] || {};
                      const gradient = design.gradient || "from-gray-500 to-gray-600";
                      const gradientLight = design.gradientLight || "from-gray-50 to-gray-100";
                      const description = design.description || "Explore this category";

                      return (
                        <motion.button
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -8, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCategorySelect(category)}
                          className={`relative overflow-hidden rounded-3xl p-8 transition-all duration-300 ${
                            isSelected
                              ? `bg-gradient-to-br ${gradient} shadow-2xl border-2 border-white`
                              : `bg-gradient-to-br ${gradientLight} border-2 border-gray-200 hover:border-gray-300`
                          }`}
                        >
                          <div className="relative z-10">
                            <div
                              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                                isSelected
                                  ? "bg-white/20 backdrop-blur"
                                  : `bg-gradient-to-br ${gradient}`
                              }`}
                            >
                              <Icon className="w-9 h-9 text-white" />
                            </div>
                            <h3
                              className={`text-2xl font-bold mb-2 text-left ${
                                isSelected ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {category.name}
                            </h3>
                            <p
                              className={`text-sm text-left ${
                                isSelected ? "text-white/90" : "text-gray-600"
                              }`}
                            >
                              {description}
                            </p>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25,
                                  }}
                                  className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <Check className="w-5 h-5 text-green-600" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </motion.div>

                {/* Subcategories */}
                {selectedCategory && subcategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-lg"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {t.selectSubcategory}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {subcategories.map((subcategory) => (
                        <motion.button
                          key={subcategory.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleSubcategorySelect(subcategory)}
                          className="relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                        >
                          <p className="text-gray-900 font-semibold text-center text-sm">
                            {subcategory.name}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Listing Details */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 border border-gray-100">
              <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center">
                      {React.createElement(
                        categoryIconMap[selectedCategory.slug] || ShoppingBag,
                        { className: "w-6 h-6 text-brand" }
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Category</p>
                      <p className="text-gray-800 font-bold">
                        {selectedCategory.name} → {selectedSubcategory.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setStep(1);
                      setSelectedSubcategory(null);
                    }}
                    className="text-brand text-sm font-semibold"
                  >
                    {t.change}
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-brand" />
                  {t.uploadPhotos}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-brand">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t.dragDrop}</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {uploadedImages.length}/10
                    </p>
                  </div>
                </label>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {t.listingDetails}
                </h3>
                <div>
                  <label className="block text-gray-500 mb-2 text-sm font-semibold">
                    {t.title} <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder={t.titlePlaceholder}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-2 text-sm font-semibold">
                    {t.description} <span className="text-brand">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder={t.descriptionPlaceholder}
                    rows="6"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-500 mb-2 text-sm font-semibold">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {t.price} <span className="text-brand">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      placeholder={t.pricePlaceholder}
                      step="0.01"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-2 text-sm font-semibold">
                      {t.currency}
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        handleInputChange("currency", e.target.value)
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option>EUR</option>
                      <option>USD</option>
                      <option>GBP</option>
                      <option>TRY</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-2 text-sm font-semibold">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {t.location} <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder={t.locationPlaceholder}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 border border-gray-300 text-gray-800 py-4 px-6 rounded-2xl hover:bg-gray-300 disabled:opacity-50 font-semibold"
                >
                  {t.back}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-brand text-white py-4 px-6 rounded-2xl hover:bg-brand-dark disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.creatingListing}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {t.publish}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListingPage;