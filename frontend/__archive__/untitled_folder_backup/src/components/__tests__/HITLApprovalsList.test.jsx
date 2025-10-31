import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HITLApprovalsList from '../HITLApprovalsList';
import * as useHITLGateModule from '../../hooks/useHITLGate';

jest.mock('../../hooks/useHITLGate');
jest.mock('../HITLApprovalModal', () => {
  return function MockHITLApprovalModal() {
    return <div data-testid="hitl-modal">Mock Modal</div>;
  };
});

describe('HITLApprovalsList Component', () => {
  const mockPendingApprovals = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      demand_lead_id: '550e8400-e29b-41d4-a716-446655440001',
      target_seller_count: 42,
      medium: 'whatsapp',
      created_at: '2025-10-22T10:00:00Z',
      rfd_summary: '2BR apartment in Kyrenia for €600',
      contact_info: 'user@example.com',
      location: 'Kyrenia',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      demand_lead_id: '550e8400-e29b-41d4-a716-446655440003',
      target_seller_count: 15,
      medium: 'email',
      created_at: '2025-10-22T09:00:00Z',
      rfd_summary: 'Studio apartment in Nicosia for €400',
      contact_info: 'another@example.com',
      location: 'Nicosia',
    },
  ];

  const defaultHookReturn = {
    pendingApprovals: [],
    pendingCount: 0,
    isLoading: false,
    isSubmitting: false,
    error: null,
    refreshPending: jest.fn(),
    approveBroadcast: jest.fn(),
    rejectBroadcast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useHITLGateModule.default.mockReturnValue(defaultHookReturn);
  });

  describe('Access Control', () => {
    test('should not render for non-business users', () => {
      const { container } = render(
        <HITLApprovalsList isAuthenticated={true} userType="regular" />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should render for business users', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [],
        pendingCount: 0,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText(/All Caught Up/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('should show loading state initially', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
        pendingCount: 0,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText(/Loading pending approvals/i)).toBeInTheDocument();
    });

    test('should show empty state when no pending approvals', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [],
        pendingCount: 0,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText(/All Caught Up/i)).toBeInTheDocument();
      expect(screen.getByText(/No pending approvals/i)).toBeInTheDocument();
    });
  });

  describe('Approvals List Display', () => {
    test('should display pending count badge', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: mockPendingApprovals,
        pendingCount: 2,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('should display all approval cards', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: mockPendingApprovals,
        pendingCount: 2,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      mockPendingApprovals.forEach((approval) => {
        expect(screen.getByText(approval.rfd_summary.substring(0, 50))).toBeInTheDocument();
      });
    });

    test('should format date correctly in list', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [mockPendingApprovals[0]],
        pendingCount: 1,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      const expectedDate = new Date(mockPendingApprovals[0].created_at).toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should open modal when clicking Review button', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [mockPendingApprovals[0]],
        pendingCount: 1,
        isLoading: false,
      });

      const { rerender } = render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      const reviewBtn = screen.getByRole('button', { name: /Review/i });
      fireEvent.click(reviewBtn);

      // Modal should be rendered
      expect(screen.getByTestId('hitl-modal')).toBeInTheDocument();
    });

    test('should open modal when clicking approval card', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [mockPendingApprovals[0]],
        pendingCount: 1,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      const card = screen.getByText(mockPendingApprovals[0].rfd_summary.substring(0, 50));
      fireEvent.click(card);

      // Modal should be rendered
      expect(screen.getByTestId('hitl-modal')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    test('should use hook with correct props', () => {
      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(useHITLGateModule.default).toHaveBeenCalledWith(true);
    });
  });

  describe('Multiple Approvals', () => {
    test('should handle multiple approvals in list', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: mockPendingApprovals,
        pendingCount: 2,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      // Both approvals should be visible
      expect(screen.getByText(/2BR apartment/i)).toBeInTheDocument();
      expect(screen.getByText(/Studio apartment/i)).toBeInTheDocument();

      // Badge should show 2
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});

import HITLApprovalsList from '../HITLApprovalsList';
import * as useHITLGateModule from '../../hooks/useHITLGate';

jest.mock('../../hooks/useHITLGate');
jest.mock('../HITLApprovalModal', () => {
  return function MockHITLApprovalModal() {
    return <div data-testid="hitl-modal">Mock Modal</div>;
  };
});

describe('HITLApprovalsList Component', () => {
  const mockPendingApprovals = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      demand_lead_id: '550e8400-e29b-41d4-a716-446655440001',
      target_seller_count: 42,
      medium: 'whatsapp',
      created_at: '2025-10-22T10:00:00Z',
      rfd_summary: '2BR apartment in Kyrenia for €600',
      contact_info: 'user@example.com',
      location: 'Kyrenia',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      demand_lead_id: '550e8400-e29b-41d4-a716-446655440003',
      target_seller_count: 15,
      medium: 'email',
      created_at: '2025-10-22T09:00:00Z',
      rfd_summary: 'Studio apartment in Nicosia for €400',
      contact_info: 'another@example.com',
      location: 'Nicosia',
    },
  ];

  const defaultHookReturn = {
    pendingApprovals: [],
    pendingCount: 0,
    isLoading: false,
    isSubmitting: false,
    error: null,
    refreshPending: jest.fn(),
    approveBroadcast: jest.fn(),
    rejectBroadcast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useHITLGateModule.default.mockReturnValue(defaultHookReturn);
  });

  describe('Access Control', () => {
    test('should not render for non-business users', () => {
      const { container } = render(
        <HITLApprovalsList isAuthenticated={true} userType="regular" />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should render for business users', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [],
        pendingCount: 0,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText(/All Caught Up/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('should show loading state initially', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
        pendingCount: 0,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText(/Loading pending approvals/i)).toBeInTheDocument();
    });

    test('should show empty state when no pending approvals', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [],
        pendingCount: 0,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText(/All Caught Up/i)).toBeInTheDocument();
      expect(screen.getByText(/No pending approvals/i)).toBeInTheDocument();
    });
  });

  describe('Approvals List Display', () => {
    test('should display pending count badge', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: mockPendingApprovals,
        pendingCount: 2,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('should display all approval cards', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: mockPendingApprovals,
        pendingCount: 2,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      mockPendingApprovals.forEach((approval) => {
        expect(screen.getByText(approval.rfd_summary.substring(0, 50))).toBeInTheDocument();
      });
    });

    test('should format date correctly in list', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [mockPendingApprovals[0]],
        pendingCount: 1,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      const expectedDate = new Date(mockPendingApprovals[0].created_at).toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should open modal when clicking Review button', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [mockPendingApprovals[0]],
        pendingCount: 1,
        isLoading: false,
      });

      const { rerender } = render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      const reviewBtn = screen.getByRole('button', { name: /Review/i });
      fireEvent.click(reviewBtn);

      // Modal should be rendered
      expect(screen.getByTestId('hitl-modal')).toBeInTheDocument();
    });

    test('should open modal when clicking approval card', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: [mockPendingApprovals[0]],
        pendingCount: 1,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      const card = screen.getByText(mockPendingApprovals[0].rfd_summary.substring(0, 50));
      fireEvent.click(card);

      // Modal should be rendered
      expect(screen.getByTestId('hitl-modal')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    test('should use hook with correct props', () => {
      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      expect(useHITLGateModule.default).toHaveBeenCalledWith(true);
    });
  });

  describe('Multiple Approvals', () => {
    test('should handle multiple approvals in list', () => {
      useHITLGateModule.default.mockReturnValue({
        ...defaultHookReturn,
        pendingApprovals: mockPendingApprovals,
        pendingCount: 2,
        isLoading: false,
      });

      render(
        <HITLApprovalsList isAuthenticated={true} userType="business" />
      );

      // Both approvals should be visible
      expect(screen.getByText(/2BR apartment/i)).toBeInTheDocument();
      expect(screen.getByText(/Studio apartment/i)).toBeInTheDocument();

      // Badge should show 2
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
