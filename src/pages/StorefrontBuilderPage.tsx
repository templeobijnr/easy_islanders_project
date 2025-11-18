import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Palette, 
  Image, 
  Layout, 
  Upload, 
  Eye, 
  Save, 
  RefreshCw,
  Package,
  ShoppingCart,
  Star,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

interface StoreSettings {
  name: string;
  description: string;
  logo: string;
  coverImage: string;
  theme: StoreTheme;
  layout: 'grid' | 'list' | 'masonry';
  featuredProducts: number;
}

const StorefrontBuilderPage: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'Modern Home Decor',
    description: 'Premium furniture and home accessories for the modern lifestyle',
    logo: '',
    coverImage: '',
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#f59e0b',
      fontFamily: 'Inter'
    },
    layout: 'grid',
    featuredProducts: 6
  });

  const [activeTab, setActiveTab] = useState<'appearance' | 'products' | 'settings'>('appearance');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleImageUpload = (type: 'logo' | 'cover') => {
    // Mock image upload - in real implementation would handle file upload
    const mockImageUrl = type === 'logo' 
      ? 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20logo%20for%20home%20decor%20store%20clean%20design&image_size=square'
      : 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20home%20decor%20store%20banner%20with%20furniture%20elegant%20design&image_size=landscape_16_9';
    
    setStoreSettings(prev => ({
      ...prev,
      [type === 'logo' ? 'logo' : 'coverImage']: mockImageUrl
    }));
  };

  const handleThemeChange = (key: keyof StoreTheme, value: string) => {
    setStoreSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value
      }
    }));
  };

  const handleSaveStore = () => {
    // Mock save functionality
    console.log('Saving store settings:', storeSettings);
    alert('Store settings saved successfully!');
  };

  const previewStore = () => {
    setIsPreviewMode(true);
    // In real implementation, would open preview in new tab/window
    window.open('/store/modern-home-decor', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Store className="w-8 h-8 text-blue-600" />
                Storefront Builder
              </h1>
              <p className="text-gray-600 mt-2">
                Customize your store appearance, manage products, and create the perfect shopping experience
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={previewStore}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview Store
              </Button>
              <Button 
                onClick={handleSaveStore}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Store Customization
                </CardTitle>
                <CardDescription>
                  Personalize your store's appearance and layout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Appearance
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Products
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* Appearance Tab */}
                  <TabsContent value="appearance" className="space-y-6">
                    {/* Store Info */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="store-name">Store Name</Label>
                        <Input
                          id="store-name"
                          value={storeSettings.name}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="store-description">Store Description</Label>
                        <Textarea
                          id="store-description"
                          value={storeSettings.description}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Images */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Store Logo</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {storeSettings.logo ? (
                            <img src={storeSettings.logo} alt="Store logo" className="w-20 h-20 mx-auto rounded-lg object-cover" />
                          ) : (
                            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                              <Image className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 w-full"
                            onClick={() => handleImageUpload('logo')}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cover Image</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {storeSettings.coverImage ? (
                            <img src={storeSettings.coverImage} alt="Store cover" className="w-full h-20 object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Image className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 w-full"
                            onClick={() => handleImageUpload('cover')}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Cover
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Theme Colors */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Theme Colors</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primary-color">Primary Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="primary-color"
                              type="color"
                              value={storeSettings.theme.primaryColor}
                              onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={storeSettings.theme.primaryColor}
                              onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="secondary-color">Secondary Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="secondary-color"
                              type="color"
                              value={storeSettings.theme.secondaryColor}
                              onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={storeSettings.theme.secondaryColor}
                              onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Layout Options */}
                    <div className="space-y-4">
                      <Label>Product Layout</Label>
                      <Select value={storeSettings.layout} onValueChange={(value: any) => setStoreSettings(prev => ({ ...prev, layout: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Grid Layout</SelectItem>
                          <SelectItem value="list">List Layout</SelectItem>
                          <SelectItem value="masonry">Masonry Layout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  {/* Products Tab */}
                  <TabsContent value="products" className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Featured Products</h4>
                        <p className="text-sm text-gray-600">Select products to highlight on your storefront</p>
                      </div>
                      <Select value={String(storeSettings.featuredProducts)} onValueChange={(value) => setStoreSettings(prev => ({ ...prev, featuredProducts: Number(value) }))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Products</SelectItem>
                          <SelectItem value="6">6 Products</SelectItem>
                          <SelectItem value="9">9 Products</SelectItem>
                          <SelectItem value="12">12 Products</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mock Product Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((product) => (
                        <Card key={product} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <h5 className="font-medium text-gray-900 mb-1">Product {product}</h5>
                            <p className="text-sm text-gray-600 mb-3">${(Math.random() * 200 + 50).toFixed(2)}</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                <Star className="w-3 h-3 mr-1" />
                                Feature
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Settings className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Store Status</h5>
                          <p className="text-sm text-gray-600">Your store is currently active and visible to customers</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-700">Active</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Total Products</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">156</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">This Month</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">89</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your changes look in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg overflow-hidden"
                  style={{ 
                    backgroundColor: storeSettings.theme.backgroundColor,
                    color: storeSettings.theme.textColor
                  }}
                >
                  {/* Store Header Preview */}
                  <div 
                    className="p-4 text-center"
                    style={{ backgroundColor: storeSettings.theme.primaryColor, color: 'white' }}
                  >
                    {storeSettings.logo && (
                      <img src={storeSettings.logo} alt="" className="w-12 h-12 mx-auto mb-2 rounded-lg" />
                    )}
                    <h3 className="font-bold text-lg">{storeSettings.name}</h3>
                    <p className="text-sm opacity-90">{storeSettings.description}</p>
                  </div>

                  {/* Products Preview */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="border rounded p-2">
                          <div className="w-full h-16 bg-gray-200 rounded mb-1"></div>
                          <div className="text-xs font-medium">Item {item}</div>
                          <div className="text-xs" style={{ color: storeSettings.theme.accentColor }}>
                            $99.99
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full text-sm"
                      style={{ backgroundColor: storeSettings.theme.secondaryColor }}
                    >
                      View All Products
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('appearance')}
                    >
                      <Palette className="w-3 h-3 mr-2" />
                      Edit Theme
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('products')}
                    >
                      <Package className="w-3 h-3 mr-2" />
                      Manage Products
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={previewStore}
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      Full Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorefrontBuilderPage;