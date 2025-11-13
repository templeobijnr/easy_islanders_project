import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Calendar } from 'lucide-react';

const PayoutsStatusCard: React.FC = () => {
  const payouts = {
    paid: { amount: '€89,200', count: 42 },
    pending: { amount: '€12,540', count: 8 },
    scheduled: { amount: '€18,300', count: 6, date: '2025-11-20' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payouts Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 border rounded-lg flex items-center justify-between bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold">Paid Out</p>
                <p className="text-xs text-muted-foreground">{payouts.paid.count} transactions</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-700">{payouts.paid.amount}</p>
          </div>

          <div className="p-4 border rounded-lg flex items-center justify-between bg-yellow-50">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-semibold">Pending</p>
                <p className="text-xs text-muted-foreground">{payouts.pending.count} transactions</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{payouts.pending.amount}</p>
          </div>

          <div className="p-4 border rounded-lg flex items-center justify-between bg-blue-50">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold">Scheduled</p>
                <p className="text-xs text-muted-foreground">
                  {payouts.scheduled.count} transactions • {payouts.scheduled.date}
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-700">{payouts.scheduled.amount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutsStatusCard;
