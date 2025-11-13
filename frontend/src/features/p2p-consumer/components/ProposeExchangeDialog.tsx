import React, { useState } from 'react';
import { useProposeExchange } from '../hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProposeExchangeDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProposeExchangeDialog: React.FC<ProposeExchangeDialogProps> = ({
  postId,
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    message: '',
    proposed_exchange: '',
  });

  const proposeMutation = useProposeExchange(postId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    proposeMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          message: '',
          proposed_exchange: '',
        });
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Propose Exchange</DialogTitle>
          <DialogDescription>
            Send an exchange proposal to the post owner
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Your Name</Label>
            <Input
              id="contact_name"
              placeholder="Your full name"
              value={formData.contact_name}
              onChange={(e) =>
                setFormData({ ...formData, contact_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="your@email.com"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData({ ...formData, contact_email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Phone (optional)</Label>
            <Input
              id="contact_phone"
              placeholder="+1 (555) 000-0000"
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData({ ...formData, contact_phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Tell them why you're interested..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposed_exchange">What You're Offering</Label>
            <Textarea
              id="proposed_exchange"
              placeholder="Describe what you can offer in exchange..."
              value={formData.proposed_exchange}
              onChange={(e) =>
                setFormData({ ...formData, proposed_exchange: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={proposeMutation.isPending}>
              {proposeMutation.isPending ? 'Sending...' : 'Send Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
