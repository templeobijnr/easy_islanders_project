import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

const AgentPerformanceCard: React.FC = () => {
  const agents = [
    { name: 'Sarah Thompson', closings: 8, conversionRate: '12%', avgDealSize: '€275K' },
    { name: 'Michael Chen', closings: 6, conversionRate: '10%', avgDealSize: '€310K' },
    { name: 'Elena Petrov', closings: 5, conversionRate: '9%', avgDealSize: '€285K' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle>Agent Performance</CardTitle>
        </div>
        <CardDescription>Sales team metrics for current quarter</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Closings</TableHead>
              <TableHead>Conversion Rate</TableHead>
              <TableHead>Avg Deal Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent, idx) => (
              <TableRow key={agent.name} className={idx === 0 ? 'bg-yellow-50' : ''}>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.closings}</TableCell>
                <TableCell>{agent.conversionRate}</TableCell>
                <TableCell className="font-semibold">{agent.avgDealSize}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceCard;
