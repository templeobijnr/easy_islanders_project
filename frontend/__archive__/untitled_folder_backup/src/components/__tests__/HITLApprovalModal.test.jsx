import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HITLApprovalModal from '../HITLApprovalModal';

describe('HITLApprovalModal Component', () => {
  const mockApproval = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    demand_lead_id: '550e8400-e29b-41d4-a716-446655440001',
    target_seller_count: 42,
    medium: 'whatsapp',
    created_at: '2025-10-22T10:00:00Z',
    rfd_summary: '2BR apartment in Kyrenia for €600',
    contact_info: 'user@example.com',
    location: 'Kyrenia',
  };

  const mockOnClose = jest.fn();
  const mockOnApprove = jest.fn();
  const mockOnReject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    test('should not render when isOpen is false', () => {
      const { container } = render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={false}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should not render when approval is null', () => {
      const { container } = render(
        <HITLApprovalModal
          approval={null}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should render modal when isOpen and approval provided', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );
      expect(screen.getByText('Broadcast Approval')).toBeInTheDocument();
    });
  });

  describe('RFQ Details Display', () => {
    test('should display all RFQ details', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText(mockApproval.rfd_summary)).toBeInTheDocument();
      expect(screen.getByText('Kyrenia')).toBeInTheDocument();
      expect(screen.getByText(mockApproval.contact_info)).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('WHATSAPP')).toBeInTheDocument();
    });

    test('should display truncated ID', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('550e8400...')).toBeInTheDocument();
    });

    test('should format date correctly', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const dateStr = new Date(mockApproval.created_at).toLocaleDateString();
      expect(screen.getByText(dateStr)).toBeInTheDocument();
    });
  });

  describe('Approval Form', () => {
    test('should have optional notes field', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const notesField = screen.getByPlaceholderText(/High priority lead/i);
      expect(notesField).toBeInTheDocument();
      expect(notesField).not.toBeRequired();
    });

    test('should allow typing notes', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const notesField = screen.getByPlaceholderText(/High priority lead/i);
      await userEvent.type(notesField, 'Test notes');
      expect(notesField.value).toBe('Test notes');
    });

    test('should call onApprove with ID and notes when approved', async () => {
      mockOnApprove.mockResolvedValueOnce({ success: true, message: 'Approved' });

      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const notesField = screen.getByPlaceholderText(/High priority lead/i);
      await userEvent.type(notesField, 'Test approval notes');

      const approveBtn = screen.getByRole('button', { name: /Approve & Broadcast/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledWith(mockApproval.id, 'Test approval notes');
      });
    });

    test('should show loading state during approval', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={true}
        />
      );

      const approveBtn = screen.getByRole('button', { name: /Approve & Broadcast|Approving/i });
      expect(approveBtn).toBeDisabled();
    });
  });

  describe('Rejection Form', () => {
    test('should have required reason field', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      expect(reasonField).toBeInTheDocument();
    });

    test('should prevent rejection without reason', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(screen.getByText('Rejection reason is required')).toBeInTheDocument();
      });

      expect(mockOnReject).not.toHaveBeenCalled();
    });

    test('should allow typing reason', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      await userEvent.type(reasonField, 'Not enough detail provided');
      expect(reasonField.value).toBe('Not enough detail provided');
    });

    test('should call onReject with ID and reason', async () => {
      mockOnReject.mockResolvedValueOnce({ success: true, message: 'Rejected' });

      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      await userEvent.type(reasonField, 'Policy violation');

      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith(mockApproval.id, 'Policy violation');
      });
    });

    test('should clear error when typing reason', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast/i });

      // Try to reject without reason
      fireEvent.click(rejectBtn);
      expect(screen.getByText('Rejection reason is required')).toBeInTheDocument();

      // Type reason - error should clear
      await userEvent.type(reasonField, 'Test reason');
      await waitFor(() => {
        expect(screen.queryByText('Rejection reason is required')).not.toBeInTheDocument();
      });
    });

    test('should show loading state during rejection', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={true}
        />
      );

      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast|Rejecting/i });
      expect(rejectBtn).toBeDisabled();
    });
  });

  describe('Modal Controls', () => {
    test('should close modal when clicking close button', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const closeBtn = screen.getByRole('button', { name: '' });
      fireEvent.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should close modal when clicking backdrop', async () => {
      const { container } = render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should disable close button during submission', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={true}
        />
      );

      const closeBtn = screen.getAllByRole('button')[0];
      expect(closeBtn).toBeDisabled();
    });
  });

  describe('User Feedback', () => {
    test('should display header and description', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Broadcast Approval')).toBeInTheDocument();
      expect(screen.getByText('Review RFQ details before broadcasting')).toBeInTheDocument();
    });

    test('should display info box with instructions', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/About This Approval/i)).toBeInTheDocument();
      expect(screen.getByText(/broadcast to.*sellers if approved/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive classes', () => {
      const { container } = render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      // Check for max-w-2xl and other responsive utilities
      const modalContent = container.querySelector('.max-w-2xl');
      expect(modalContent).toBeInTheDocument();
    });
  });
});

import userEvent from '@testing-library/user-event';
import HITLApprovalModal from '../HITLApprovalModal';

describe('HITLApprovalModal Component', () => {
  const mockApproval = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    demand_lead_id: '550e8400-e29b-41d4-a716-446655440001',
    target_seller_count: 42,
    medium: 'whatsapp',
    created_at: '2025-10-22T10:00:00Z',
    rfd_summary: '2BR apartment in Kyrenia for €600',
    contact_info: 'user@example.com',
    location: 'Kyrenia',
  };

  const mockOnClose = jest.fn();
  const mockOnApprove = jest.fn();
  const mockOnReject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    test('should not render when isOpen is false', () => {
      const { container } = render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={false}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should not render when approval is null', () => {
      const { container } = render(
        <HITLApprovalModal
          approval={null}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should render modal when isOpen and approval provided', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );
      expect(screen.getByText('Broadcast Approval')).toBeInTheDocument();
    });
  });

  describe('RFQ Details Display', () => {
    test('should display all RFQ details', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText(mockApproval.rfd_summary)).toBeInTheDocument();
      expect(screen.getByText('Kyrenia')).toBeInTheDocument();
      expect(screen.getByText(mockApproval.contact_info)).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('WHATSAPP')).toBeInTheDocument();
    });

    test('should display truncated ID', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('550e8400...')).toBeInTheDocument();
    });

    test('should format date correctly', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const dateStr = new Date(mockApproval.created_at).toLocaleDateString();
      expect(screen.getByText(dateStr)).toBeInTheDocument();
    });
  });

  describe('Approval Form', () => {
    test('should have optional notes field', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const notesField = screen.getByPlaceholderText(/High priority lead/i);
      expect(notesField).toBeInTheDocument();
      expect(notesField).not.toBeRequired();
    });

    test('should allow typing notes', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const notesField = screen.getByPlaceholderText(/High priority lead/i);
      await userEvent.type(notesField, 'Test notes');
      expect(notesField.value).toBe('Test notes');
    });

    test('should call onApprove with ID and notes when approved', async () => {
      mockOnApprove.mockResolvedValueOnce({ success: true, message: 'Approved' });

      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const notesField = screen.getByPlaceholderText(/High priority lead/i);
      await userEvent.type(notesField, 'Test approval notes');

      const approveBtn = screen.getByRole('button', { name: /Approve & Broadcast/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledWith(mockApproval.id, 'Test approval notes');
      });
    });

    test('should show loading state during approval', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={true}
        />
      );

      const approveBtn = screen.getByRole('button', { name: /Approve & Broadcast|Approving/i });
      expect(approveBtn).toBeDisabled();
    });
  });

  describe('Rejection Form', () => {
    test('should have required reason field', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      expect(reasonField).toBeInTheDocument();
    });

    test('should prevent rejection without reason', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(screen.getByText('Rejection reason is required')).toBeInTheDocument();
      });

      expect(mockOnReject).not.toHaveBeenCalled();
    });

    test('should allow typing reason', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      await userEvent.type(reasonField, 'Not enough detail provided');
      expect(reasonField.value).toBe('Not enough detail provided');
    });

    test('should call onReject with ID and reason', async () => {
      mockOnReject.mockResolvedValueOnce({ success: true, message: 'Rejected' });

      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      await userEvent.type(reasonField, 'Policy violation');

      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith(mockApproval.id, 'Policy violation');
      });
    });

    test('should clear error when typing reason', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const reasonField = screen.getByPlaceholderText(/Insufficient detail/i);
      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast/i });

      // Try to reject without reason
      fireEvent.click(rejectBtn);
      expect(screen.getByText('Rejection reason is required')).toBeInTheDocument();

      // Type reason - error should clear
      await userEvent.type(reasonField, 'Test reason');
      await waitFor(() => {
        expect(screen.queryByText('Rejection reason is required')).not.toBeInTheDocument();
      });
    });

    test('should show loading state during rejection', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={true}
        />
      );

      const rejectBtn = screen.getByRole('button', { name: /Reject Broadcast|Rejecting/i });
      expect(rejectBtn).toBeDisabled();
    });
  });

  describe('Modal Controls', () => {
    test('should close modal when clicking close button', async () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const closeBtn = screen.getByRole('button', { name: '' });
      fireEvent.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should close modal when clicking backdrop', async () => {
      const { container } = render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should disable close button during submission', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={true}
        />
      );

      const closeBtn = screen.getAllByRole('button')[0];
      expect(closeBtn).toBeDisabled();
    });
  });

  describe('User Feedback', () => {
    test('should display header and description', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Broadcast Approval')).toBeInTheDocument();
      expect(screen.getByText('Review RFQ details before broadcasting')).toBeInTheDocument();
    });

    test('should display info box with instructions', () => {
      render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/About This Approval/i)).toBeInTheDocument();
      expect(screen.getByText(/broadcast to.*sellers if approved/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive classes', () => {
      const { container } = render(
        <HITLApprovalModal
          approval={mockApproval}
          isOpen={true}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isSubmitting={false}
        />
      );

      // Check for max-w-2xl and other responsive utilities
      const modalContent = container.querySelector('.max-w-2xl');
      expect(modalContent).toBeInTheDocument();
    });
  });
});
