import React from 'react';
import { Building2, TrendingUp, Calendar, Users, CheckCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';

/**
 * Real Estate Domain Home
 * Tailored overview for property management sellers
 */
export const DomainHomeRealEstate: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            Real Estate Overview
          </h1>
          <p className="text-slate-600 mt-1">Manage rentals, sales, and occupancy at a glance</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Top Row: Occupancy, Revenue, Pipeline */}
      <div className="grid gap-6 xl:grid-cols-3">
        <RealEstateOccupancyCard />
        <RealEstateRevenueCard />
        <RealEstatePipelineCard />
      </div>

      {/* Bottom Row: Channels, Tasks, Broadcast Teaser */}
      <div className="grid gap-6 xl:grid-cols-3">
        <RealEstateChannelsCard />
        <RealEstateTasksCard />
        <RealEstateBroadcastTeaser />
      </div>
    </div>
  );
};

// Occupancy Card
const RealEstateOccupancyCard: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span className="text-lg">Occupancy Rate</span>
        <Badge variant="default" className="bg-green-100 text-green-800">+5%</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-slate-900 mb-2">87%</div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span>24 / 28 units occupied</span>
      </div>
      <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-[87%]" />
      </div>
    </CardContent>
  </Card>
);

// Revenue Card
const RealEstateRevenueCard: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span className="text-lg">Monthly Revenue</span>
        <TrendingUp className="w-5 h-5 text-blue-600" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-slate-900 mb-2">€45,200</div>
      <div className="text-sm text-slate-600">
        <span className="text-green-600 font-semibold">↑ 12%</span> vs last month
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-slate-500">Rental Income</div>
          <div className="font-semibold text-slate-900">€38,400</div>
        </div>
        <div>
          <div className="text-slate-500">Sales</div>
          <div className="font-semibold text-slate-900">€6,800</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Pipeline Card
const RealEstatePipelineCard: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span className="text-lg">Sales Pipeline</span>
        <Calendar className="w-5 h-5 text-purple-600" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Viewing Requests</span>
          <Badge className="bg-purple-100 text-purple-800">12</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Offers Pending</span>
          <Badge className="bg-amber-100 text-amber-800">5</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Closing Soon</span>
          <Badge className="bg-green-100 text-green-800">2</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Channels Card
const RealEstateChannelsCard: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="text-lg">Top Channels</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Direct Website</span>
          <span className="text-sm font-semibold">45%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Zillow</span>
          <span className="text-sm font-semibold">28%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Referrals</span>
          <span className="text-sm font-semibold">18%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Other</span>
          <span className="text-sm font-semibold">9%</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Tasks Card
const RealEstateTasksCard: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span className="text-lg">Pending Tasks</span>
        <Badge className="bg-red-100 text-red-800">4</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>Maintenance request: Unit 12B</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span>Lease renewal: Unit 5A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span>Inspection due: Building A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>New listing review</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Broadcast Teaser Card
const RealEstateBroadcastTeaser: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Bell className="w-5 h-5 text-blue-600" />
        Broadcast Center
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-slate-600 mb-4">
        Reach 1,200+ interested buyers and tenants instantly
      </p>
      <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
        Create Broadcast
      </Button>
    </CardContent>
  </Card>
);

// Missing Plus import
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="width" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
