import React from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Tag,
  Truck,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import ProductUploadForm from '../../../../features/marketplace/components/ProductUploadForm';
import api from '../../../../api';

/**
 * Products / Marketplace Domain Home
 * Tailored overview for product sellers
 *
 * Route: /dashboard/home/products
 */
export const DomainHomeProducts: React.FC = () => {
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = React.useState(false);

  const handleGoToProducts = () => {
    navigate('/dashboard/home/products/products');
  };

  const handleGoToOrders = () => {
    navigate('/dashboard/home/products/orders');
  };

  const handleGoToAnalytics = () => {
    navigate('/dashboard/home/products/analytics');
  };

  const handleGoToUpload = () => {
    setAddOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl">
              <Package className="w-8 h-8 text-white" />
            </div>
            Marketplace Overview
          </h1>
          <p className="text-slate-600 mt-1">
            Manage products, orders, and sales performance in one place
          </p>
        </div>
        <Button
          variant="premium"
          className="gap-2"
          onClick={handleGoToUpload}
        >
          <PlusIcon className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Top Row: Products, Orders, Revenue */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Total Products</span>
              <Package className="w-5 h-5 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 mb-2">
              156
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Badge className="bg-emerald-100 text-emerald-800">
                +12% vs last month
              </Badge>
              <span>Active across all categories</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Active Orders</span>
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 mb-2">
              23
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Badge className="bg-amber-100 text-amber-800">
                5 awaiting dispatch
              </Badge>
              <span>Keep fulfillment SLA healthy</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Monthly Revenue</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 mb-2">
              €45,600
            </div>
            <div className="text-sm text-slate-600">
              <span className="text-emerald-600 font-semibold">↑ 22%</span>{' '}
              vs last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Areas: Cards that link into deeper pages */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Products & Inventory */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-amber-600" />
              Products & Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Create, update, and organize your catalog. Track stock levels and
              keep best-sellers in view.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Edit product details and pricing</li>
              <li>• Monitor low or out-of-stock items</li>
              <li>• View basic performance per product</li>
            </ul>
            <Button
              variant="outline"
              className="mt-2 w-full justify-center gap-2"
              onClick={handleGoToProducts}
            >
              Manage Products
            </Button>
          </CardContent>
        </Card>

        {/* Orders & Fulfillment */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Orders & Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Stay on top of new orders, shipping statuses, and delivery
              issues.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Track order lifecycle from paid to delivered</li>
              <li>• Spot delayed or at‑risk orders</li>
              <li>• Coordinate with your shipping partners</li>
            </ul>
            <Button
              variant="outline"
              className="mt-2 w-full justify-center gap-2"
              onClick={handleGoToOrders}
            >
              View Orders
            </Button>
          </CardContent>
        </Card>

        {/* Sales & Analytics */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Sales & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Understand what&apos;s working across categories, channels, and
              time periods.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Revenue trends by product and category</li>
              <li>• Conversion and basket value insights</li>
              <li>• Simple reports ready for export</li>
            </ul>
            <Button
              variant="outline"
              className="mt-2 w-full justify-center gap-2"
              onClick={handleGoToAnalytics}
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Areas */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="w-5 h-5 text-violet-600" />
              Promotions & Marketing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Plan campaigns, discounts, and featured slots to drive more
              demand.
            </p>
            <p className="text-xs text-slate-500">
              Coming soon – this area will connect to marketplace marketing
              tools.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="w-5 h-5 text-sky-600" />
              Shipping & Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Configure shipping zones, delivery options, and handling
              times.
            </p>
            <p className="text-xs text-slate-500">
              Coming soon – configure carrier rules and pricing.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Customer Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Keep an eye on customer questions and post‑purchase issues.
            </p>
            <p className="text-xs text-slate-500">
              Use the main inbox in your dashboard to respond quickly.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto pr-2">
          <ProductUploadForm
            onSubmit={async (fd) => {
              const payload: any = {
                title: fd.name,
                description: fd.description,
                price: parseFloat(fd.price || '0') || 0,
                currency: 'EUR',
                stock: fd.quantity || 0,
                category_type: fd.subcategory || fd.category || null,
                sku: fd.sku || null,
              };
              const created = await api.createSellerListing('products', payload);
              const listingId = created?.id;
              if (listingId && fd.images && fd.images.length) {
                for (const file of fd.images) {
                  await api.uploadListingImage(listingId, file);
                }
              }
              if (listingId && fd.status && fd.status !== 'draft') {
                await api.updateSellerListing(listingId, 'products', { status: fd.status });
              }
              setAddOpen(false);
              navigate('/dashboard/home/products/products');
            }}
          />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Local Plus icon to avoid import churn in other modules
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
