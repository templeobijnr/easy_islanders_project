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
  Settings,
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
      fontFamily: 'Inter',
    },
    layout: 'grid',
    featuredProducts: 6,
  });

  const [activeTab, setActiveTab] = useState<'appearance' | 'products' | 'settings'>('appearance');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleImageUpload = (type: 'logo' | 'cover') => {
    const mockImageUrl =
      type === 'logo'
        ? 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20logo%20for%20home%20decor%20store%20clean%20design&image_size=square'
        : 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20home%20decor%20store%20banner%20with%20furniture%20elegant%20design&image_size=landscape_16_9';

    setStoreSettings((prev) => ({
      ...prev,
      [type === 'logo' ? 'logo' : 'coverImage']: mockImageUrl,
    }));
  };

  const handleThemeChange = (key: keyof StoreTheme, value: string) => {
    setStoreSettings((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }));
  };

  const handleSaveStore = () => {
    // Mock save functionality
    // eslint-disable-next-line no-console
    console.log('Saving store settings:', storeSettings);
    // eslint-disable-next-line no-alert
    alert('Store settings saved successfully!');
  };

  const previewStore = () => {
    setIsPreviewMode(true);
    window.open('/store/modern-home-decor', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Store className="w-8 h-8 text-blue-600" />
                Storefront Builder
              </h1>
              <p className="text-gray-600 mt-2">
                Customize your store appearance, manage products, and create the perfect shopping
                experience
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={previewStore} className="flex items-center gap-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Store Customization
                </CardTitle>
                <CardDescription>Personalize your store&apos;s appearance and layout</CardDescription>
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

                  <TabsContent value="appearance" className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="store-name">Store Name</Label>
                        <Input
                          id="store-name"
                          value={storeSettings.name}
                          onChange={(e) =>
                            setStoreSettings((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="store-description">Store Description</Label>
                        <Textarea
                          id="store-description"
                          value={storeSettings.description}
                          onChange={(e) =>
                            setStoreSettings((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Store Logo</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {storeSettings.logo ? (
                            <img
                              src={storeSettings.logo}
                              alt="Store logo"
                              className="w-20 h-20 mx-auto rounded-lg object-cover"
                            />
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
                            <img
                              src={storeSettings.coverImage}
                              alt="Store cover"
                              className="w-full h-20 object-cover rounded-lg"
                            />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Primary Color</Label>
                          <Input
                            type="color"
                            value={storeSettings.theme.primaryColor}
                            onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                            className="mt-1 h-10 p-1"
                          />
                        </div>
                        <div>
                          <Label>Secondary Color</Label>
                          <Input
                            type="color"
                            value={storeSettings.theme.secondaryColor}
                            onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                            className="mt-1 h-10 p-1"
                          />
                        </div>
                        <div>
                          <Label>Accent Color</Label>
                          <Input
                            type="color"
                            value={storeSettings.theme.accentColor}
                            onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                            className="mt-1 h-10 p-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Background Color</Label>
                          <Input
                            type="color"
                            value={storeSettings.theme.backgroundColor}
                            onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                            className="mt-1 h-10 p-1"
                          />
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            type="color"
                            value={storeSettings.theme.textColor}
                            onChange={(e) => handleThemeChange('textColor', e.target.value)}
                            className="mt-1 h-10 p-1"
                          />
                        </div>
                        <div>
                          <Label>Font Family</Label>
                          <Select
                            value={storeSettings.theme.fontFamily}
                            onValueChange={(value) =>
                              setStoreSettings((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, fontFamily: value },
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select font family" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="System">System</SelectItem>
                              <SelectItem value="Serif">Serif</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="products" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Layout</Label>
                          <Select
                            value={storeSettings.layout}
                            onValueChange={(value: StoreSettings['layout']) =>
                              setStoreSettings((prev) => ({ ...prev, layout: value }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select layout" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grid">Grid</SelectItem>
                              <SelectItem value="list">List</SelectItem>
                              <SelectItem value="masonry">Masonry</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Featured Products</Label>
                          <Input
                            type="number"
                            value={storeSettings.featuredProducts}
                            onChange={(e) =>
                              setStoreSettings((prev) => ({
                                ...prev,
                                featuredProducts: parseInt(e.target.value || '0', 10),
                              }))
                            }
                            className="mt-1"
                            min={0}
                            max={20}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Product Card Layout</Label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {['grid', 'list', 'masonry'].map((layout) => (
                              <button
                                key={layout}
                                type="button"
                                onClick={() =>
                                  setStoreSettings((prev) => ({
                                    ...prev,
                                    layout: layout as StoreSettings['layout'],
                                  }))
                                }
                                className={`border rounded-lg p-3 flex flex-col items-center gap-2 ${
                                  storeSettings.layout === layout
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <Layout className="w-5 h-5" />
                                <span className="text-xs capitalize">{layout}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Product Display Tips</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Use high-quality product images</li>
                            <li>• Highlight your best-selling items</li>
                            <li>• Keep product descriptions clear and concise</li>
                            <li>• Use consistent pricing formats</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Store URL</Label>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-flex items-center px-3 rounded-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              easyislanders.com/store/
                            </span>
                            <Input
                              value="modern-home-decor"
                              onChange={() => null}
                              className="flex-1 rounded-l-none"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Store Status</Label>
                          <Select defaultValue="active">
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Store Description for SEO</Label>
                          <Textarea
                            value="Modern home decor store specializing in premium furniture and accessories"
                            onChange={() => null}
                            className="mt-1"
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Store Visibility</Label>
                          <div className="space-y-2 mt-1">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded" />
                              <span className="text-sm text-gray-700">
                                Show store in marketplace search
                              </span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded" />
                              <span className="text-sm text-gray-700">
                                Feature store in curated collections
                              </span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded" />
                              <span className="text-sm text-gray-700">
                                Allow customers to follow store
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Store Performance</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Conversion Rate</p>
                              <p className="text-2xl font-bold text-blue-600">4.2%</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Average Order Value</p>
                              <p className="text-2xl font-bold text-blue-600">$89.50</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Returning Customers</p>
                              <p className="text-2xl font-bold text-blue-600">32%</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Store Rating</p>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-2xl font-bold text-blue-600">4.8</span>
                                <span className="text-sm text-gray-600">/ 5.0</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="font-medium text-gray-900">Store Status</h5>
                          <p className="text-sm text-gray-600">
                            Your store is currently active and visible to customers
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
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

          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>See how your changes look in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: storeSettings.theme.backgroundColor,
                    color: storeSettings.theme.textColor,
                  }}
                >
                  <div
                    className="p-4 text-center"
                    style={{ backgroundColor: storeSettings.theme.primaryColor, color: 'white' }}
                  >
                    {storeSettings.logo && (
                      <img
                        src={storeSettings.logo}
                        alt=""
                        className="w-12 h-12 mx-auto mb-2 rounded-lg"
                      />
                    )}
                    <h3 className="font-bold text-lg">{storeSettings.name}</h3>
                    <p className="text-sm opacity-90">{storeSettings.description}</p>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="border rounded p-2">
                          <div className="w-full h-16 bg-gray-200 rounded mb-1" />
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

