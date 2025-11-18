import React, { useState } from 'react';
import { motion, AnimatePresence as FMAnimatePresence } from 'framer-motion';

// Type-safe wrapper for AnimatePresence to fix TypeScript issues
const AnimatePresence = FMAnimatePresence as React.ComponentType<React.PropsWithChildren<{ mode?: "wait" | "sync" }>>;
import { 
  Package, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Minus,
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  image: string;
  sales: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductManagementProps {
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateStock?: (productId: string, newStock: number) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  onEditProduct,
  onDeleteProduct,
  onUpdateStock
}) => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Wireless Headphones Pro',
      description: 'Premium noise-canceling wireless headphones with 30-hour battery life',
      price: 189.99,
      category: 'Electronics',
      subcategory: 'Audio',
      stock: 45,
      status: 'active',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20wireless%20headphones%20sleek%20design%20black%20color%20professional%20look&image_size=square',
      sales: 23,
      revenue: 4369.77,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20'
    },
    {
      id: '2',
      name: 'Organic Cotton T-Shirt',
      description: 'Comfortable organic cotton t-shirt available in multiple colors',
      price: 29.99,
      category: 'Fashion',
      subcategory: 'Clothing',
      stock: 120,
      status: 'active',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Organic%20cotton%20t-shirt%20folded%20neatly%20white%20background%20minimalist%20style&image_size=square',
      sales: 67,
      revenue: 2009.33,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18'
    },
    {
      id: '3',
      name: 'Smart Home Security Camera',
      description: '1080p HD security camera with night vision and motion detection',
      price: 149.99,
      category: 'Electronics',
      subcategory: 'Smart Home',
      stock: 8,
      status: 'active',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Smart%20home%20security%20camera%20modern%20design%20white%20color%20compact%20size&image_size=square',
      sales: 15,
      revenue: 2249.85,
      createdAt: '2024-01-12',
      updatedAt: '2024-01-19'
    },
    {
      id: '4',
      name: 'Yoga Mat Premium',
      description: 'Extra thick yoga mat with non-slip surface',
      price: 39.99,
      category: 'Sports',
      subcategory: 'Fitness',
      stock: 0,
      status: 'draft',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20yoga%20mat%20rolled%20up%20purple%20color%20high%20quality%20material&image_size=square',
      sales: 0,
      revenue: 0,
      createdAt: '2024-01-22',
      updatedAt: '2024-01-22'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    subcategory: '',
    stock: 0,
    status: 'draft' as Product['status'],
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleStockEdit = (productId: string, currentStock: number) => {
    setEditingStock(productId);
    setStockValue(currentStock);
  };

  const handleStockSave = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId ? { ...product, stock: stockValue } : product
    ));
    setEditingStock(null);
    onUpdateStock?.(productId, stockValue);
  };

  const handleStockCancel = () => {
    setEditingStock(null);
    setStockValue(0);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ComponentType<any> }> = {
      active: { className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      draft: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      archived: { className: 'bg-gray-100 text-gray-800', icon: Archive }
    };
    
    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { className: 'text-red-600 bg-red-50', label: 'Out of Stock' };
    if (stock < 10) return { className: 'text-orange-600 bg-orange-50', label: 'Low Stock' };
    return { className: 'text-emerald-600 bg-emerald-50', label: 'In Stock' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Management</h1>
          <p className="text-slate-600">Manage your products, inventory, and listings</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button className="bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Sports">Sports</option>
            </select>
            
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-sm text-slate-600">{product.category} • {product.subcategory}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setEditingProduct(product);
                          setFormValues({
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            category: product.category,
                            subcategory: product.subcategory,
                            stock: product.stock,
                            status: product.status,
                          });
                          setEditOpen(true);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => onDeleteProduct?.(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Price and Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">€{product.price}</p>
                      <p className="text-sm text-slate-600">Per unit</p>
                    </div>
                    {getStatusBadge(product.status)}
                  </div>
                  
                  {/* Stock Management */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Inventory</span>
                      {editingStock === product.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleStockCancel}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStockSave(product.id)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStockEdit(product.id, product.stock)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {editingStock === product.id ? (
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStockValue(Math.max(0, stockValue - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={stockValue}
                          onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                          min="0"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStockValue(stockValue + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold">{product.stock}</p>
                          <p className={`text-xs px-2 py-1 rounded-full ${getStockStatus(product.stock).className}`}>
                            {getStockStatus(product.stock).label}
                          </p>
                        </div>
                        {product.stock === 0 && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Sales Performance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">Sales</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-900">{product.sales}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Revenue</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">€{product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredProducts.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formValues.name} onChange={(e) => setFormValues(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={formValues.description} onChange={(e) => setFormValues(v => ({ ...v, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (€)</Label>
                <Input id="price" type="number" step="0.01" value={formValues.price} onChange={(e) => setFormValues(v => ({ ...v, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={formValues.stock} onChange={(e) => setFormValues(v => ({ ...v, stock: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={formValues.category} onChange={(e) => setFormValues(v => ({ ...v, category: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input id="subcategory" value={formValues.subcategory} onChange={(e) => setFormValues(v => ({ ...v, subcategory: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select id="status" className="mt-2 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" value={formValues.status} onChange={(e) => setFormValues(v => ({ ...v, status: e.target.value as Product['status'] }))}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!editingProduct) { setEditOpen(false); return; }
              const updated = { ...editingProduct, ...formValues } as Product;
              setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
              onEditProduct?.(updated);
              setEditOpen(false);
              setEditingProduct(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
