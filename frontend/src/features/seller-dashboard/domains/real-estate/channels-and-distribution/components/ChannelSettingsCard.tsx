import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const ChannelSettingsCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Settings</CardTitle>
        <CardDescription>Manage which channels display each property</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Channel management interface coming soon</p>
          <p className="text-sm mt-2">Toggle property visibility across distribution channels</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelSettingsCard;
