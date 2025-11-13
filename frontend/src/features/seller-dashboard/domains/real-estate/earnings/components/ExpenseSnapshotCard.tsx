import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const ExpenseSnapshotCard: React.FC = () => {
  const expenses = [
    { category: 'Maintenance & Repairs', amount: '€3,200', percentage: 45 },
    { category: 'Cleaning Services', amount: '€1,800', percentage: 25 },
    { category: 'Utilities', amount: '€1,400', percentage: 20 },
    { category: 'Management Fees', amount: '€720', percentage: 10 },
  ];

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount.replace('€', '').replace(',', '')), 0);
  const revenue = 142300;
  const netEarnings = revenue - total;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Snapshot</CardTitle>
        <CardDescription>YTD expenses by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{expense.category}</span>
                <span className="font-semibold">{expense.amount}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${expense.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Expenses</span>
            <span className="font-semibold">€{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Revenue</span>
            <span className="font-semibold">€{revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-green-700 pt-2 border-t">
            <span>Net Earnings</span>
            <span>€{netEarnings.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseSnapshotCard;
