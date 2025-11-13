import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MyP2PPosts } from './MyP2PPosts';
import { BrowseP2PPosts } from './BrowseP2PPosts';
import { MyExchangeProposals } from './MyExchangeProposals';
import { CreateP2PPostDialog } from './CreateP2PPostDialog';

export const P2PMarketplace: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">P2P Marketplace</h1>
          <p className="text-gray-600 mt-2">
            Create, browse, and exchange items and services with other users
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Posts</TabsTrigger>
          <TabsTrigger value="my-posts">My Posts</TabsTrigger>
          <TabsTrigger value="proposals">Exchange Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <BrowseP2PPosts />
        </TabsContent>

        <TabsContent value="my-posts" className="space-y-4">
          <MyP2PPosts />
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <MyExchangeProposals />
        </TabsContent>
      </Tabs>

      <CreateP2PPostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
