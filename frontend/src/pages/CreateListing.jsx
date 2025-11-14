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
  HeartPulse,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../shared/context/AuthContext";
import config from "../config";
import { CATEGORY_DESIGN } from "../lib/categoryDesign";
import { PageTransition, StaggerContainer, StaggerItem, AnimatedWrapper } from "../components/ui/animated-wrapper";
import { spacing, layout } from "../lib/spacing";
import { Skeleton } from "../components/ui/skeleton";

const CardSkeleton = ({ className }) => (
  <Skeleton className={`h-48 w-full rounded-3xl ${className}`} />
);

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
    // Canonical slugs (taxonomy)
    cars: Car,
    events: Sparkles,
    restaurants: UtensilsCrossed,
    health_beauty: HeartPulse,
  };

  // --- Fetch Categories ---
  useEffect(() => {
    if (isAuthenticated && user?.user_type === "business") {
      fetchCategories();
    }
  }, [isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get(`${config.API_BASE_URL}/api/categories/`);
      
      // Handle the response format: {categories: [...], count: number}
      const categoriesData = response.data.categories || [];
      setCategories(categoriesData.filter(cat => cat.is_active));
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  // --- Handle Category Selection ---
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Subcategories are already included in the category data
    setSubcategories(category.subcategories || []);
    // Reset dynamic fields when category changes
    setFormData(prev => ({ ...prev, dynamic_fields: {} }));
  };


  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setStep(2);
  };

  // --- Handle Dynamic Fields ---
  const handleDynamicFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      dynamic_fields: {
        ...prev.dynamic_fields,
        [fieldName]: value
      }
    }));
  };

  // --- Render Dynamic Fields ---
  const renderDynamicFields = () => {
    if (!selectedCategory?.schema?.fields) return null;

    return selectedCategory.schema.fields.map((field) => {
      const value = formData.dynamic_fields[field.name] || '';
      
      return (
        <div key={field.name} className="space-y-2">
          <label className="block text-muted-foreground mb-2 text-sm font-semibold">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.type === 'text' && (
            <input
              type="text"
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          )}
          
          {field.type === 'number' && (
            <input
              type="number"
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, parseFloat(e.target.value) || '')}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              min={field.min || 0}
              max={field.max}
              required={field.required}
            />
          )}
          
          {field.type === 'select' && (
            <select
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.choices?.map((choice) => (
                <option key={choice} value={choice}>
                  {choice.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          )}
          
          {field.type === 'boolean' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={field.name}
                checked={value === true}
                onChange={(e) => handleDynamicFieldChange(field.name, e.target.checked)}
                className="w-4 h-4 text-brand border-border rounded focus:ring-brand"
              />
              <label htmlFor={field.name} className="text-sm text-slate-600">
                {field.label}
              </label>
            </div>
          )}
          
          {field.type === 'textarea' && (
            <textarea
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              rows={3}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          )}
        </div>
      );
    });
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
    // Basic validation
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.price.trim() ||
      !formData.location.trim()
    ) {
      setError(t.validationError);
      return false;
    }

    // Dynamic fields validation
    if (selectedCategory?.schema?.fields) {
      for (const field of selectedCategory.schema.fields) {
        if (field.required) {
          const value = formData.dynamic_fields[field.name];
          if (!value && value !== 0 && value !== false) {
            setError(`${field.label} is required`);
            return false;
          }
        }
      }
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
          category: selectedCategory.id,
          subcategory: selectedSubcategory?.id,
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
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-background rounded-3xl p-8 text-center">
            <Lock className="w-16 h-16 text-brand mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t.pleaseLogin}
            </h1>
            <p className="text-muted-foreground">
              You need to be logged in to create a new listing.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (user?.user_type !== "business") {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-background rounded-3xl p-8 text-center">
            <Briefcase className="w-16 h-16 text-brand mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t.businessAccountRequired}
            </h1>
            <p className="text-muted-foreground">
              Switch to a business account to start selling.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // --- Main Render ---
  console.log('CreateListing: Main render - categories:', categories.length, 'loading:', categoriesLoading);
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
      {/* Alerts */}
      {error && (
        <div className={spacing.pageContainer}>
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className={spacing.pageContainer}>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-300">{t.success}</p>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className={spacing.pageContainer}>
        <div className="flex items-center justify-center mb-12">
          <div className={spacing.buttonGroupGap}>
            {[1, 2].map((num) => (
              <React.Fragment key={num}>
                <div className={step >= num ? "text-brand" : "text-muted-foreground"}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= num ? "bg-brand text-white" : "bg-muted"
                    }`}
                  >
                    {num}
                  </div>
                </div>
                {num === 1 && (
                  <ChevronRight className="w-6 h-6 text-muted-foreground" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              {t.selectCategory}
            </h2>
            {categoriesLoading ? (
              <div className={layout.grid3}>
                {Array(6).fill(0).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <StaggerContainer className={layout.grid3}>
                  {categories.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <p className="text-muted-foreground text-lg">No categories found</p>
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
                        <StaggerItem key={category.id}>
                          <motion.button
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCategorySelect(category)}
                            className={`relative overflow-hidden rounded-3xl ${spacing.cardPadding} transition-all duration-300 ${
                              isSelected
                                ? `bg-gradient-to-br ${gradient} shadow-2xl border-2 border-white`
                                : `bg-gradient-to-br ${gradientLight} border-2 border-border hover:border-border`
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
                                  isSelected ? "text-white" : "text-foreground"
                                }`}
                              >
                                {category.name}
                              </h3>
                              <p
                                className={`text-sm text-left ${
                                  isSelected ? "text-white/90" : "text-muted-foreground"
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
                        </StaggerItem>
                      );
                    })
                  )}
                </StaggerContainer>

                {/* Subcategories */}
                {selectedCategory && subcategories.length > 0 && (
                  <AnimatedWrapper animation="fadeInUp" className={`bg-background rounded-3xl ${spacing.cardPadding} border-2 border-border shadow-lg`}>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      {t.selectSubcategory}
                    </h3>
                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {subcategories.map((subcategory) => (
                        <StaggerItem key={subcategory.id}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleSubcategorySelect(subcategory)}
                            className="relative bg-gradient-to-br from-background to-muted border-2 border-border rounded-xl p-4 hover:shadow-lg transition-all"
                          >
                            <p className="text-foreground font-semibold text-center text-sm">
                              {subcategory.name}
                            </p>
                          </motion.button>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </AnimatedWrapper>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Listing Details */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <AnimatedWrapper animation="fadeInUp">
              <div className={`bg-background rounded-3xl ${spacing.cardPadding} border border-border`}>
                <div className={`mb-8 ${spacing.cardPadding} bg-muted rounded-2xl border border-border`}>
                  <div className="flex items-center justify-between">
                    <div className={spacing.buttonGap}>
                      <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center">
                        {React.createElement(
                          categoryIconMap[selectedCategory.slug] || ShoppingBag,
                          { className: "w-6 h-6 text-brand" }
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Category</p>
                        <p className="text-foreground font-bold">
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
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-brand" />
                    {t.uploadPhotos}
                  </h3>
                  <div className={`grid grid-cols-2 md:grid-cols-4 ${spacing.gridGap} mb-4`}>
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl border border-border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4 text-background" />
                        </button>
                      </div>
                    ))}
                    {loading && Array(2).fill(0).map((_, i) => (
                      <Skeleton key={`skeleton-${i}`} className="h-32 w-full rounded-xl" />
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
                    <div className="border-2 border-dashed border-muted-foreground rounded-2xl p-8 text-center cursor-pointer hover:border-brand">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{t.dragDrop}</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        {uploadedImages.length}/10
                      </p>
                    </div>
                  </label>
                </div>

                {/* Form Fields */}
                <div className={spacing.formGap}>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {t.listingDetails}
                  </h3>
                  <div>
                    <label className="block text-muted-foreground mb-2 text-sm font-semibold">
                      {t.title} <span className="text-brand">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder={t.titlePlaceholder}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-2 text-sm font-semibold">
                      {t.description} <span className="text-brand">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder={t.descriptionPlaceholder}
                      rows="6"
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                    />
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 ${spacing.gridGap}`}>
                    <div>
                      <label className="block text-muted-foreground mb-2 text-sm font-semibold">
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
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-2 text-sm font-semibold">
                        {t.currency}
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) =>
                          handleInputChange("currency", e.target.value)
                        }
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option>EUR</option>
                        <option>USD</option>
                        <option>GBP</option>
                        <option>TRY</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-2 text-sm font-semibold">
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
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  
                  {/* Dynamic Fields */}
                  {selectedCategory?.schema?.fields && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-brand" />
                        {selectedCategory.name} Details
                      </h3>
                      <div className={spacing.formGap}>
                        {renderDynamicFields()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={`flex ${spacing.buttonGroupGap} mt-8 pt-6 border-t border-border`}>
                  <button
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex-1 bg-muted border border-border text-foreground py-4 px-6 rounded-2xl hover:bg-muted/80 disabled:opacity-50 font-semibold"
                  >
                    {t.back}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-brand text-background py-4 px-6 rounded-2xl hover:bg-brand/90 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
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
            </AnimatedWrapper>
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
};

export default CreateListingPage;
