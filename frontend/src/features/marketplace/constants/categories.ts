/**
 * Marketplace Categories and Subcategories
 * Comprehensive category structure for marketplace businesses
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategory: string;
}

export const MARKETPLACE_CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets, devices, and electronic accessories',
    icon: 'smartphone',
    color: 'blue',
    subcategories: [
      { id: 'smartphones', name: 'Smartphones', slug: 'smartphones', description: 'Mobile phones and accessories', parentCategory: 'electronics' },
      { id: 'laptops', name: 'Laptops', slug: 'laptops', description: 'Notebooks, ultrabooks, and accessories', parentCategory: 'electronics' },
      { id: 'tablets', name: 'Tablets', slug: 'tablets', description: 'iPads, Android tablets, and e-readers', parentCategory: 'electronics' },
      { id: 'cameras', name: 'Cameras', slug: 'cameras', description: 'Digital cameras, DSLRs, and accessories', parentCategory: 'electronics' },
      { id: 'audio', name: 'Audio & Headphones', slug: 'audio-headphones', description: 'Speakers, headphones, and audio equipment', parentCategory: 'electronics' },
      { id: 'gaming', name: 'Gaming', slug: 'gaming', description: 'Consoles, games, and gaming accessories', parentCategory: 'electronics' },
      { id: 'smart-home', name: 'Smart Home', slug: 'smart-home', description: 'Home automation and IoT devices', parentCategory: 'electronics' },
      { id: 'accessories', name: 'Accessories', slug: 'electronics-accessories', description: 'Cables, chargers, and electronic accessories', parentCategory: 'electronics' }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion & Clothing',
    slug: 'fashion',
    description: 'Trendy clothing, shoes, and accessories',
    icon: 'shirt',
    color: 'pink',
    subcategories: [
      { id: 'mens-clothing', name: "Men's Clothing", slug: 'mens-clothing', description: 'Shirts, pants, suits, and menswear', parentCategory: 'fashion' },
      { id: 'womens-clothing', name: "Women's Clothing", slug: 'womens-clothing', description: 'Dresses, tops, skirts, and womenswear', parentCategory: 'fashion' },
      { id: 'kids-clothing', name: "Kids' Clothing", slug: 'kids-clothing', description: 'Children and baby clothing', parentCategory: 'fashion' },
      { id: 'shoes', name: 'Shoes', slug: 'shoes', description: 'Sneakers, boots, sandals, and footwear', parentCategory: 'fashion' },
      { id: 'bags', name: 'Bags & Accessories', slug: 'bags-accessories', description: 'Handbags, wallets, and fashion accessories', parentCategory: 'fashion' },
      { id: 'jewelry', name: 'Jewelry & Watches', slug: 'jewelry-watches', description: 'Necklaces, rings, watches, and jewelry', parentCategory: 'fashion' },
      { id: 'sportswear', name: 'Sportswear', slug: 'sportswear', description: 'Athletic clothing and activewear', parentCategory: 'fashion' },
      { id: 'lingerie', name: 'Lingerie & Sleepwear', slug: 'lingerie-sleepwear', description: 'Undergarments and sleepwear', parentCategory: 'fashion' }
    ]
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Furniture, decor, and gardening supplies',
    icon: 'home',
    color: 'green',
    subcategories: [
      { id: 'furniture', name: 'Furniture', slug: 'furniture', description: 'Sofas, beds, tables, and home furniture', parentCategory: 'home-garden' },
      { id: 'home-decor', name: 'Home Decor', slug: 'home-decor', description: 'Decorative items and home accessories', parentCategory: 'home-garden' },
      { id: 'kitchen', name: 'Kitchen & Dining', slug: 'kitchen-dining', description: 'Cookware, appliances, and dining sets', parentCategory: 'home-garden' },
      { id: 'bedding', name: 'Bedding & Bath', slug: 'bedding-bath', description: 'Sheets, towels, and bathroom accessories', parentCategory: 'home-garden' },
      { id: 'lighting', name: 'Lighting', slug: 'lighting', description: 'Lamps, ceiling lights, and lighting fixtures', parentCategory: 'home-garden' },
      { id: 'garden', name: 'Garden & Outdoor', slug: 'garden-outdoor', description: 'Plants, tools, and outdoor furniture', parentCategory: 'home-garden' },
      { id: 'storage', name: 'Storage & Organization', slug: 'storage-organization', description: 'Storage solutions and organization tools', parentCategory: 'home-garden' },
      { id: 'appliances', name: 'Home Appliances', slug: 'home-appliances', description: 'Large and small home appliances', parentCategory: 'home-garden' }
    ]
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Sports equipment, fitness gear, and outdoor activities',
    icon: 'dumbbell',
    color: 'orange',
    subcategories: [
      { id: 'fitness-equipment', name: 'Fitness Equipment', slug: 'fitness-equipment', description: 'Gym equipment, weights, and exercise machines', parentCategory: 'sports-fitness' },
      { id: 'outdoor-sports', name: 'Outdoor Sports', slug: 'outdoor-sports', description: 'Camping, hiking, and outdoor sports gear', parentCategory: 'sports-fitness' },
      { id: 'team-sports', name: 'Team Sports', slug: 'team-sports', description: 'Basketball, soccer, and team sports equipment', parentCategory: 'sports-fitness' },
      { id: 'water-sports', name: 'Water Sports', slug: 'water-sports', description: 'Swimming, surfing, and water sports gear', parentCategory: 'sports-fitness' },
      { id: 'cycling', name: 'Cycling', slug: 'cycling', description: 'Bikes, cycling gear, and accessories', parentCategory: 'sports-fitness' },
      { id: 'racket-sports', name: 'Racket Sports', slug: 'racket-sports', description: 'Tennis, badminton, and racket sports', parentCategory: 'sports-fitness' },
      { id: 'winter-sports', name: 'Winter Sports', slug: 'winter-sports', description: 'Skiing, snowboarding, and winter gear', parentCategory: 'sports-fitness' },
      { id: 'sports-nutrition', name: 'Sports Nutrition', slug: 'sports-nutrition', description: 'Supplements, protein, and sports nutrition', parentCategory: 'sports-fitness' }
    ]
  },
  {
    id: 'beauty-health',
    name: 'Beauty & Health',
    slug: 'beauty-health',
    description: 'Cosmetics, skincare, and health products',
    icon: 'heart',
    color: 'purple',
    subcategories: [
      { id: 'skincare', name: 'Skincare', slug: 'skincare', description: 'Cleansers, moisturizers, and skincare products', parentCategory: 'beauty-health' },
      { id: 'makeup', name: 'Makeup', slug: 'makeup', description: 'Cosmetics, foundation, and beauty products', parentCategory: 'beauty-health' },
      { id: 'haircare', name: 'Hair Care', slug: 'haircare', description: 'Shampoo, styling products, and hair tools', parentCategory: 'beauty-health' },
      { id: 'fragrances', name: 'Fragrances', slug: 'fragrances', description: 'Perfumes, colognes, and fragrances', parentCategory: 'beauty-health' },
      { id: 'personal-care', name: 'Personal Care', slug: 'personal-care', description: 'Deodorant, oral care, and personal hygiene', parentCategory: 'beauty-health' },
      { id: 'vitamins', name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Health supplements and vitamins', parentCategory: 'beauty-health' },
      { id: 'medical', name: 'Medical Supplies', slug: 'medical-supplies', description: 'First aid and medical equipment', parentCategory: 'beauty-health' },
      { id: 'wellness', name: 'Wellness & Relaxation', slug: 'wellness-relaxation', description: 'Aromatherapy, massage, and wellness products', parentCategory: 'beauty-health' }
    ]
  },
  {
    id: 'automotive',
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car parts, accessories, and automotive services',
    icon: 'car',
    color: 'red',
    subcategories: [
      { id: 'car-accessories', name: 'Car Accessories', slug: 'car-accessories', description: 'Interior and exterior car accessories', parentCategory: 'automotive' },
      { id: 'car-parts', name: 'Car Parts', slug: 'car-parts', description: 'Engine parts, brakes, and replacement parts', parentCategory: 'automotive' },
      { id: 'car-care', name: 'Car Care & Maintenance', slug: 'car-care-maintenance', description: 'Cleaning products, oils, and maintenance items', parentCategory: 'automotive' },
      { id: 'tires', name: 'Tires & Wheels', slug: 'tires-wheels', description: 'Tires, rims, and wheel accessories', parentCategory: 'automotive' },
      { id: 'tools-equipment', name: 'Tools & Equipment', slug: 'tools-equipment', description: 'Automotive tools and garage equipment', parentCategory: 'automotive' },
      { id: 'electronics-auto', name: 'Auto Electronics', slug: 'auto-electronics', description: 'GPS, audio systems, and car electronics', parentCategory: 'automotive' },
      { id: 'motorcycle', name: 'Motorcycle & Powersports', slug: 'motorcycle-powersports', description: 'Motorcycle parts and accessories', parentCategory: 'automotive' },
      { id: 'outdoor-vehicle', name: 'Outdoor Vehicle Accessories', slug: 'outdoor-vehicle-accessories', description: 'Truck, SUV, and off-road accessories', parentCategory: 'automotive' }
    ]
  },
  {
    id: 'toys-games',
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Toys, games, and entertainment for all ages',
    icon: 'gamepad-2',
    color: 'yellow',
    subcategories: [
      { id: 'action-figures', name: 'Action Figures', slug: 'action-figures', description: 'Collectible figures and toys', parentCategory: 'toys-games' },
      { id: 'board-games', name: 'Board Games', slug: 'board-games', description: 'Family board games and puzzles', parentCategory: 'toys-games' },
      { id: 'building-toys', name: 'Building Toys', slug: 'building-toys', description: 'LEGO, blocks, and construction toys', parentCategory: 'toys-games' },
      { id: 'educational', name: 'Educational Toys', slug: 'educational-toys', description: 'Learning toys and STEM products', parentCategory: 'toys-games' },
      { id: 'outdoor-toys', name: 'Outdoor Toys', slug: 'outdoor-toys', description: 'Playground equipment and outdoor games', parentCategory: 'toys-games' },
      { id: 'dolls', name: 'Dolls & Accessories', slug: 'dolls-accessories', description: 'Dolls, dollhouses, and accessories', parentCategory: 'toys-games' },
      { id: 'remote-control', name: 'Remote Control Toys', slug: 'remote-control-toys', description: 'RC cars, drones, and remote toys', parentCategory: 'toys-games' },
      { id: 'video-games', name: 'Video Games', slug: 'video-games', description: 'Console games and gaming accessories', parentCategory: 'toys-games' }
    ]
  },
  {
    id: 'books-media',
    name: 'Books & Media',
    slug: 'books-media',
    description: 'Books, music, movies, and digital content',
    icon: 'book',
    color: 'indigo',
    subcategories: [
      { id: 'fiction', name: 'Fiction Books', slug: 'fiction-books', description: 'Novels, short stories, and fiction', parentCategory: 'books-media' },
      { id: 'non-fiction', name: 'Non-Fiction Books', slug: 'non-fiction-books', description: 'Biographies, history, and educational books', parentCategory: 'books-media' },
      { id: 'textbooks', name: 'Textbooks', slug: 'textbooks', description: 'Academic and educational textbooks', parentCategory: 'books-media' },
      { id: 'children-books', name: "Children's Books", slug: 'children-books', description: 'Kids books and educational materials', parentCategory: 'books-media' },
      { id: 'music', name: 'Music', slug: 'music', description: 'CDs, vinyl records, and music downloads', parentCategory: 'books-media' },
      { id: 'movies', name: 'Movies & TV', slug: 'movies-tv', description: 'DVDs, Blu-rays, and digital movies', parentCategory: 'books-media' },
      { id: 'ebooks', name: 'E-Books & Digital', slug: 'ebooks-digital', description: 'Digital books and audiobooks', parentCategory: 'books-media' },
      { id: 'magazines', name: 'Magazines & Comics', slug: 'magazines-comics', description: 'Periodicals and comic books', parentCategory: 'books-media' }
    ]
  },
  {
    id: 'food-grocery',
    name: 'Food & Grocery',
    slug: 'food-grocery',
    description: 'Fresh food, beverages, and grocery items',
    icon: 'shopping-bag',
    color: 'emerald',
    subcategories: [
      { id: 'fresh-produce', name: 'Fresh Produce', slug: 'fresh-produce', description: 'Fruits, vegetables, and fresh herbs', parentCategory: 'food-grocery' },
      { id: 'meat-seafood', name: 'Meat & Seafood', slug: 'meat-seafood', description: 'Fresh meat, poultry, and seafood', parentCategory: 'food-grocery' },
      { id: 'dairy', name: 'Dairy & Eggs', slug: 'dairy-eggs', description: 'Milk, cheese, yogurt, and eggs', parentCategory: 'food-grocery' },
      { id: 'bakery', name: 'Bakery', slug: 'bakery', description: 'Bread, pastries, and baked goods', parentCategory: 'food-grocery' },
      { id: 'beverages', name: 'Beverages', slug: 'beverages', description: 'Coffee, tea, juices, and drinks', parentCategory: 'food-grocery' },
      { id: 'pantry', name: 'Pantry Staples', slug: 'pantry-staples', description: 'Pasta, rice, canned goods, and staples', parentCategory: 'food-grocery' },
      { id: 'snacks', name: 'Snacks & Sweets', slug: 'snacks-sweets', description: 'Chips, cookies, and confectionery', parentCategory: 'food-grocery' },
      { id: 'frozen', name: 'Frozen Foods', slug: 'frozen-foods', description: 'Frozen meals, vegetables, and desserts', parentCategory: 'food-grocery' }
    ]
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    description: 'Pet food, toys, and care products',
    icon: 'paw-print',
    color: 'cyan',
    subcategories: [
      { id: 'pet-food', name: 'Pet Food', slug: 'pet-food', description: 'Dog food, cat food, and pet nutrition', parentCategory: 'pet-supplies' },
      { id: 'pet-toys', name: 'Pet Toys', slug: 'pet-toys', description: 'Toys and entertainment for pets', parentCategory: 'pet-supplies' },
      { id: 'pet-beds', name: 'Pet Beds & Furniture', slug: 'pet-beds-furniture', description: 'Beds, carriers, and pet furniture', parentCategory: 'pet-supplies' },
      { id: 'pet-care', name: 'Pet Care & Grooming', slug: 'pet-care-grooming', description: 'Grooming tools and pet care products', parentCategory: 'pet-supplies' },
      { id: 'pet-health', name: 'Pet Health & Wellness', slug: 'pet-health-wellness', description: 'Supplements and health products for pets', parentCategory: 'pet-supplies' },
      { id: 'pet-clothing', name: 'Pet Clothing', slug: 'pet-clothing', description: 'Clothing and accessories for pets', parentCategory: 'pet-supplies' },
      { id: 'aquarium', name: 'Aquarium & Fish', slug: 'aquarium-fish', description: 'Fish tanks, supplies, and aquarium products', parentCategory: 'pet-supplies' },
      { id: 'bird-supplies', name: 'Bird Supplies', slug: 'bird-supplies', description: 'Cages, food, and accessories for birds', parentCategory: 'pet-supplies' }
    ]
  }
];

// Helper functions
export const getCategoryById = (id: string): Category | undefined => {
  return MARKETPLACE_CATEGORIES.find(category => category.id === id);
};

export const getSubcategoryById = (id: string): Subcategory | undefined => {
  for (const category of MARKETPLACE_CATEGORIES) {
    const subcategory = category.subcategories.find(sub => sub.id === id);
    if (subcategory) return subcategory;
  }
  return undefined;
};

export const getSubcategoriesByCategory = (categoryId: string): Subcategory[] => {
  const category = getCategoryById(categoryId);
  return category ? category.subcategories : [];
};

export const getCategoryBySubcategory = (subcategoryId: string): Category | undefined => {
  for (const category of MARKETPLACE_CATEGORIES) {
    if (category.subcategories.some(sub => sub.id === subcategoryId)) {
      return category;
    }
  }
  return undefined;
};

export const searchCategories = (query: string): Category[] => {
  const lowercaseQuery = query.toLowerCase();
  return MARKETPLACE_CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(lowercaseQuery) ||
    category.description.toLowerCase().includes(lowercaseQuery) ||
    category.subcategories.some(sub => 
      sub.name.toLowerCase().includes(lowercaseQuery) ||
      sub.description.toLowerCase().includes(lowercaseQuery)
    )
  );
};