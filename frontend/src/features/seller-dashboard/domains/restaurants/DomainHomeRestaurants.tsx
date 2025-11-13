import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

export const DomainHomeRestaurants: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Restaurants Overview</h1>
          <p className="text-slate-600">Manage your dining services</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Reservations Today</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">42</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Menu Items</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">68</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Today's Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">€3,450</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
