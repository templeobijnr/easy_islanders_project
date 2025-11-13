/**
 * Channels and Distribution section - platform performance
 */
import { useRealEstateChannelsAndDistribution } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ChannelsAndDistributionPage = () => {
  const { data } = useRealEstateChannelsAndDistribution();


  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Channels & Distribution</h1>
        <p className="text-muted-foreground mt-2 text-lg">Performance across listing platforms</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Total Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.total_channels || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>Performance by platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.channels.map((channel: any) => (
              <div key={channel.channel_name} className="border-b pb-3 last:border-0">
                <div className="font-semibold mb-2">{channel.channel_name}</div>
                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div>
                    <div className="font-medium">{channel.listings_count}</div>
                    <div>Listings</div>
                  </div>
                  <div>
                    <div className="font-medium">{channel.bookings_count}</div>
                    <div>Bookings</div>
                  </div>
                  <div>
                    <div className="font-medium">£{parseFloat(channel.revenue).toLocaleString()}</div>
                    <div>Revenue</div>
                  </div>
                </div>
              </div>
            ))}
            {data?.channels.length === 0 && (
              <div className="text-sm text-muted-foreground">No channels configured</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
