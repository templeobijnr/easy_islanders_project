import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const RequestDetailsDrawer: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Details</CardTitle>
        <CardDescription>Detailed view with conversation thread and suggested replies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Click on a request to view details and conversation history</p>
          <p className="text-sm mt-2">AI-generated suggested replies will appear here</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestDetailsDrawer;
