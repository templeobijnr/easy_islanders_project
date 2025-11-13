import React from 'react';
import { Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

export const DomainHomeServices: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services Overview</h1>
          <p className="text-slate-600">Manage your service offerings</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Active Services</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">18</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bookings</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">45</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">€12,300</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
