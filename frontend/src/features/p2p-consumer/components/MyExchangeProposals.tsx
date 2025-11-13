import React, { useState } from 'react';
import { useMyExchangeProposals, useRespondToProposal } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const MyExchangeProposals: React.FC = () => {
  const { data: proposals, isLoading, error } = useMyExchangeProposals();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const respondMutation = useRespondToProposal(respondingTo || '');

  const handleRespond = (proposalId: string, action: 'accept' | 'reject') => {
    setRespondingTo(proposalId);
    respondMutation.mutate(action);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load proposals</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No exchange proposals yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{proposal.post_title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  From: <span className="font-medium">{proposal.proposer_name}</span>
                </p>
              </div>
              <Badge
                variant={
                  proposal.status === 'pending'
                    ? 'outline'
                    : proposal.status === 'confirmed'
                    ? 'default'
                    : 'secondary'
                }
              >
                {proposal.status === 'pending' && (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </>
                )}
                {proposal.status === 'confirmed' && (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Accepted
                  </>
                )}
                {proposal.status === 'cancelled' && 'Rejected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Message:</p>
              <p className="text-sm text-gray-600 mt-1">{proposal.message}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Proposed Exchange:</p>
              <p className="text-sm text-gray-600 mt-1">{proposal.proposed_exchange}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-xs text-gray-500">{proposal.proposer_email}</p>
                <p className="text-xs text-gray-500">
                  {new Date(proposal.created_at).toLocaleDateString()}
                </p>
              </div>
              {proposal.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(proposal.id, 'reject')}
                    disabled={respondMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(proposal.id, 'accept')}
                    disabled={respondMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
