import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Home, Calendar } from 'lucide-react';

const PipelineStageLists: React.FC = () => {
  const leads = {
    viewings: [
      {
        id: 1,
        buyer: 'John Smith',
        property: 'Sea View Apartment A12',
        offerAmount: null,
        viewingDate: '2025-11-15',
        nextAction: 'Follow up after viewing',
      },
      {
        id: 2,
        buyer: 'Maria Garcia',
        property: 'Villa Sunset Dreams',
        offerAmount: null,
        viewingDate: '2025-11-16',
        nextAction: 'Send additional photos',
      },
    ],
    offers: [
      {
        id: 3,
        buyer: 'Ahmed Hassan',
        property: 'Penthouse Luxury',
        offerAmount: '€285,000',
        viewingDate: '2025-11-10',
        nextAction: 'Negotiate price',
      },
    ],
    underContract: [
      {
        id: 4,
        buyer: 'Sarah Johnson',
        property: 'Garden House',
        offerAmount: '€320,000',
        viewingDate: '2025-11-05',
        nextAction: 'Await legal documents',
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="viewings">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="viewings">Viewings ({leads.viewings.length})</TabsTrigger>
            <TabsTrigger value="offers">Offers ({leads.offers.length})</TabsTrigger>
            <TabsTrigger value="contract">Under Contract ({leads.underContract.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="viewings" className="space-y-3 mt-4">
            {leads.viewings.map((lead) => (
              <div key={lead.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{lead.buyer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-3 w-3" />
                      <span>{lead.property}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{lead.viewingDate}</Badge>
                </div>
                <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  <strong>Next:</strong> {lead.nextAction}
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  View Details
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="offers" className="space-y-3 mt-4">
            {leads.offers.map((lead) => (
              <div key={lead.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{lead.buyer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-3 w-3" />
                      <span>{lead.property}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{lead.offerAmount}</p>
                    <p className="text-xs text-muted-foreground">Offer</p>
                  </div>
                </div>
                <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  <strong>Next:</strong> {lead.nextAction}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1">
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Counter
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contract" className="space-y-3 mt-4">
            {leads.underContract.map((lead) => (
              <div key={lead.id} className="p-4 border rounded-lg space-y-3 bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{lead.buyer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-3 w-3" />
                      <span>{lead.property}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{lead.offerAmount}</p>
                    <Badge variant="default">Under Contract</Badge>
                  </div>
                </div>
                <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                  <strong>Next:</strong> {lead.nextAction}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PipelineStageLists;
