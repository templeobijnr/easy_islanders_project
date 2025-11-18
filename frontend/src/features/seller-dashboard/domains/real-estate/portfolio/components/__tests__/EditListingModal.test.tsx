/**
 * Tests for EditListingModal Component
 * Tests inline editing functionality with dirty state tracking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditListingModal } from '../EditListingModal';
import { useUpdateListing } from '../../hooks/useRealEstateData';
import type { Listing } from '../../types/realEstateModels';

// Mock the hooks
jest.mock('../../hooks/useRealEstateData');

const mockListing: Listing = {
  id: 1,
  reference_code: 'RE-2025-001',
  title: 'Luxury Beach Villa',
  base_price: '250000',
  currency: 'EUR',
  price_period: 'TOTAL',
  status: 'ACTIVE',
  available_from: '2025-02-01',
  available_to: '2025-12-31',
  property: {
    id: 1,
    bedrooms: 3,
    bathrooms: 2,
    property_type: 'villa',
    location: {
      city: 'Kyrenia',
      district: 'Esentepe',
    },
  },
  image_urls: [],
  listing_type_code: 'sale',
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('EditListingModal', () => {
  const mockOnClose = jest.fn();
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUpdateListing as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('should render modal when open', () => {
    render(
      <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Edit Listing: RE-2025-001/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <EditListingModal listing={mockListing} isOpen={false} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText(/Edit Listing:/i)).not.toBeInTheDocument();
  });

  it('should render null when listing is null', () => {
    const { container } = render(
      <EditListingModal listing={null} isOpen={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(container.firstChild).toBeNull();
  });

  describe('Pricing Tab', () => {
    it('should display current pricing information', () => {
      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i) as HTMLInputElement;
      expect(priceInput.value).toBe('250000');
    });

    it('should allow editing price', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i);

      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      expect((priceInput as HTMLInputElement).value).toBe('300000');
    });

    it('should show price preview', () => {
      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/EUR 250,000/i)).toBeInTheDocument();
    });

    it('should update preview when price changes', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i);

      await user.clear(priceInput);
      await user.type(priceInput, '500000');

      // Preview should update
      await waitFor(() => {
        expect(screen.getByText(/EUR 500,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Availability Tab', () => {
    it('should switch to availability tab', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const availabilityTab = screen.getByRole('tab', { name: /Availability/i });
      await user.click(availabilityTab);

      expect(screen.getByLabelText(/Available From/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Available To/i)).toBeInTheDocument();
    });

    it('should display current availability dates', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const availabilityTab = screen.getByRole('tab', { name: /Availability/i });
      await user.click(availabilityTab);

      const fromInput = screen.getByLabelText(/Available From/i) as HTMLInputElement;
      const toInput = screen.getByLabelText(/Available To/i) as HTMLInputElement;

      expect(fromInput.value).toBe('2025-02-01');
      expect(toInput.value).toBe('2025-12-31');
    });
  });

  describe('Status Tab', () => {
    it('should switch to status tab', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const statusTab = screen.getByRole('tab', { name: /^Status$/i });
      await user.click(statusTab);

      expect(screen.getByLabelText(/Listing Status/i)).toBeInTheDocument();
    });

    it('should display all status options', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const statusTab = screen.getByRole('tab', { name: /^Status$/i });
      await user.click(statusTab);

      const statusSelect = screen.getByLabelText(/Listing Status/i);

      expect(statusSelect).toContainHTML('DRAFT');
      expect(statusSelect).toContainHTML('ACTIVE');
      expect(statusSelect).toContainHTML('INACTIVE');
      expect(statusSelect).toContainHTML('UNDER_OFFER');
      expect(statusSelect).toContainHTML('SOLD');
      expect(statusSelect).toContainHTML('RENTED');
    });
  });

  describe('Basic Info Tab', () => {
    it('should switch to basic info tab', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const basicTab = screen.getByRole('tab', { name: /Basic Info/i });
      await user.click(basicTab);

      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    });

    it('should display current title', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const basicTab = screen.getByRole('tab', { name: /Basic Info/i });
      await user.click(basicTab);

      const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Luxury Beach Villa');
    });
  });

  describe('Dirty State Tracking', () => {
    it('should disable save button when no changes made', () => {
      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes made', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i);

      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should show unsaved changes warning', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i);

      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      await waitFor(() => {
        expect(screen.getByText(/You have unsaved changes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call mutateAsync with updated data on submit', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i);

      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: expect.objectContaining({
            base_price: '300000',
          }),
        });
      });
    });

    it('should close modal on successful save', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i);

      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show loading state during save', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockMutateAsync.mockReturnValue(promise);

      (useUpdateListing as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      });

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const priceInput = screen.getByLabelText(/Base Price/i);

      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      const saveButton = screen.getByRole('button', { name: /Saving.../i });
      expect(saveButton).toBeDisabled();
    });

    it('should display error message on save failure', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Failed to update listing');
      mockMutateAsync.mockRejectedValue(mockError);

      (useUpdateListing as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: mockError,
      });

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/Failed to update listing/i)).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable cancel button during save', () => {
      (useUpdateListing as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      });

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Currency and Period Selection', () => {
    it('should allow changing currency', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const currencySelect = screen.getByLabelText(/Currency/i);

      await user.selectOptions(currencySelect, 'USD');

      expect((currencySelect as HTMLSelectElement).value).toBe('USD');
    });

    it('should allow changing price period', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const periodSelect = screen.getByLabelText(/Price Period/i);

      await user.selectOptions(periodSelect, 'PER_MONTH');

      expect((periodSelect as HTMLSelectElement).value).toBe('PER_MONTH');
    });

    it('should update preview with new currency and period', async () => {
      const user = userEvent.setup();

      render(
        <EditListingModal listing={mockListing} isOpen={true} onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const currencySelect = screen.getByLabelText(/Currency/i);
      const periodSelect = screen.getByLabelText(/Price Period/i);

      await user.selectOptions(currencySelect, 'GBP');
      await user.selectOptions(periodSelect, 'PER_MONTH');

      await waitFor(() => {
        expect(screen.getByText(/GBP 250,000\/month/i)).toBeInTheDocument();
      });
    });
  });
});
