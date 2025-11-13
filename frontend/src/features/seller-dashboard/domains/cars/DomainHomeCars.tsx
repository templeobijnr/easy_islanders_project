import React from 'react';
import { Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

/**
 * Cars Domain Home
 * TODO: Implement domain-specific cards for car marketplace
 */
export const DomainHomeCars: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl">
          <Car className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cars Overview</h1>
          <p className="text-slate-600">Manage your vehicle inventory and sales</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">24</div>
            <p className="text-sm text-slate-600 mt-2">Vehicles available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">8</div>
            <p className="text-sm text-slate-600 mt-2">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Month's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">€45,600</div>
            <p className="text-sm text-green-600 mt-2">↑ 15% vs last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
