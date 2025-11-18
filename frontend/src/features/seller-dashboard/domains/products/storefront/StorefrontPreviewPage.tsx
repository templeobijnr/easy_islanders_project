import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ShoppingCart,
  Heart,
  Search,
  Filter,
  Grid,
  List,
  SortAsc,
  Package,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  inStock: boolean;
  featured: boolean;
}

interface StoreData {
  name: string;
  description: string;
  logo?: string;
  coverImage?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Modern Accent Chair',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20accent%20chair%20elegant%20furniture%20design&image_size=square',
    rating: 4.8,
    reviews: 124,
    category: 'Furniture',
    inStock: true,
    featured: true
  },
  {
    id: '2',
    name: 'Ceramic Vase Set',
    price: 89.99,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=ceramic%20vase%20set%20modern%20home%20decor&image_size=square',
    rating: 4.6,
    reviews: 89,
    category: 'Decor',
    inStock: true,
    featured: false
  },
  {
    id: '3',
    name: 'LED Floor Lamp',
    price: 159.99,
    originalPrice: 199.99,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=LED%20floor%20lamp%20modern%20lighting&image_size=square',
    rating: 4.7,
    reviews: 156,
    category: 'Lighting',
    inStock: true,
    featured: true
  },
  {
    id: '4',
    name: 'Throw Pillow Collection',
    price: 45.99,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=decorative%20throw%20pillows%20collection&image_size=square',
    rating: 4.5,
    reviews: 203,
    category: 'Textiles',
    inStock: false,
    featured: false
  },
  {
    id: '5',
    name: 'Wall Art Canvas',
    price: 129.99,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20wall%20art%20canvas%20abstract&image_size=square',
    rating: 4.9,
    reviews: 67,
    category: 'Art',
    inStock: true,
    featured: false
  },
  {
    id: '6',
    name: 'Coffee Table Book',
    price: 35.99,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20table%20book%20design%20interior&image_size=square',
    rating: 4.4,
    reviews: 45,
    category: 'Books',
    inStock: true,
    featured: false
  }
];

const mockStoreData: StoreData = {
  name: 'Modern Home Decor',
  description: 'Premium furniture and home accessories for the modern lifestyle',
  logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20logo%20for%20home%20decor%20store%20clean%20design&image_size=square',
  coverImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20home%20decor%20store%20banner%20with%20furniture%20elegant%20design&image_size=landscape_16_9',
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#f59e0b'
  }
};

const StorefrontPreviewPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  const categories = ['all', 'Furniture', 'Decor', 'Lighting', 'Textiles', 'Art', 'Books'];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'featured':
      default:
        return b.featured ? 1 : -1;
    }
  });

  const addToCart = (productId: string) => {
    setCartItems(prev => [...prev, productId]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlistItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div 
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${mockStoreData.coverImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="flex items-center gap-6">
            {mockStoreData.logo && (
              <img 
                src={mockStoreData.logo} 
                alt={mockStoreData.name}
                className="w-20 h-20 rounded-lg shadow-lg"
              />
            )}
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">{mockStoreData.name}</h1>
              <p className="text-lg opacity-90">{mockStoreData.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Button variant="ghost" className="font-medium">
                All Products
              </Button>
              <Button variant="ghost">
                New Arrivals
              </Button>
              <Button variant="ghost">
                Sale Items
              </Button>
              <Button variant="ghost">
                About Store
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                className="relative"
              >
                <Heart className="w-4 h-4" />
                {wishlistItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {wishlistItems.length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="relative"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {product.featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500 text-white text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <div className="relative mb-4">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleWishlist(product.id)}
                    >
                      <Heart 
                        className={`w-4 h-4 ${wishlistItems.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-gray-900">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    {!product.inStock && (
                      <Badge variant="outline" className="text-xs">Out of Stock</Badge>
                    )}
                  </div>
                  <Button 
                    className="w-full"
                    disabled={!product.inStock}
                    onClick={() => addToCart(product.id)}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      {product.featured && (
                        <Badge className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs">
                          <Star className="w-2 h-2" />
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWishlist(product.id)}
                        >
                          <Heart 
                            className={`w-4 h-4 ${wishlistItems.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
                          />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({product.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!product.inStock && (
                            <Badge variant="outline" className="text-xs">Out of Stock</Badge>
                          )}
                          <Button 
                            size="sm"
                            disabled={!product.inStock}
                            onClick={() => addToCart(product.id)}
                          >
                            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorefrontPreviewPage;
