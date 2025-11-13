import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

export const DomainHomeP2P: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
          <Users className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">P2P Marketplace Overview</h1>
          <p className="text-slate-600">Manage your peer-to-peer listings</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Active Listings</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">15</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Offers</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">6</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Completed Sales</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">34</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
