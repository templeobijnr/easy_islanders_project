import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingModal from './BookingModal';

/**
 * BookingModal Component Tests
 * TDD: Write tests first, implement component after
 * 
 * Test cases for the booking request modal component
 */

describe('BookingModal Component', () => {
  const mockListing = {
    id: '123',
    title: 'Beautiful Villa',
    price: 150,
    currency: 'EUR',
    location: 'Kyrenia, North Cyprus',
    image_urls: ['https://example.com/image1.jpg'],
  };

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  // TEST 1: Modal displays listing details
  describe('Modal Display', () => {
    test('should render modal with listing details', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Beautiful Villa')).toBeInTheDocument();
      expect(screen.getByText('€150')).toBeInTheDocument();
      expect(screen.getByText('Kyrenia, North Cyprus')).toBeInTheDocument();
    });

    test('should display listing image', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const image = screen.getByAltText(/listing/i);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    test('should not render when isOpen is false', () => {
      const { container } = render(
        <BookingModal
          isOpen={false}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const modal = container.querySelector('[role="dialog"]');
      expect(modal).not.toBeInTheDocument();
    });

    test('should have close button', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close|×/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  // TEST 2: Date/time selection works
  describe('Date/Time Selection', () => {
    test('should display date picker', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
    });

    test('should display time picker', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/select time/i)).toBeInTheDocument();
    });

    test('should allow date selection', async () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const dateInput = screen.getByLabelText(/select date/i);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateString = futureDate.toISOString().split('T')[0];

      await userEvent.type(dateInput, dateString);
      expect(dateInput.value).toContain(dateString.slice(5)); // MM-DD format
    });

    test('should allow time selection', async () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const timeInput = screen.getByLabelText(/select time/i);
      await userEvent.type(timeInput, '14:30');

      expect(timeInput.value).toBe('14:30');
    });
  });

  // TEST 3: Can add optional message
  describe('Message Field', () => {
    test('should display message input field', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByPlaceholderText(/special requests|additional message/i)).toBeInTheDocument();
    });

    test('should allow typing message', async () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const messageInput = screen.getByPlaceholderText(/special requests|additional message/i);
      await userEvent.type(messageInput, 'I prefer morning viewings');

      expect(messageInput.value).toBe('I prefer morning viewings');
    });

    test('should allow clearing message', async () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const messageInput = screen.getByPlaceholderText(/special requests|additional message/i);
      await userEvent.type(messageInput, 'Test message');
      await userEvent.clear(messageInput);

      expect(messageInput.value).toBe('');
    });
  });

  // TEST 4: Can submit booking request
  describe('Booking Submission', () => {
    test('should have submit button', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('button', { name: /book|request|submit/i })).toBeInTheDocument();
    });

    test('should call onSubmit when submit button is clicked', async () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const dateInput = screen.getByLabelText(/select date/i);
      const timeInput = screen.getByLabelText(/select time/i);
      const submitButton = screen.getByRole('button', { name: /book|request|submit/i });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const dateString = futureDate.toISOString().split('T')[0];

      await userEvent.type(dateInput, dateString);
      await userEvent.type(timeInput, '10:00');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    test('should pass booking details to onSubmit', async () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const dateInput = screen.getByLabelText(/select date/i);
      const timeInput = screen.getByLabelText(/select time/i);
      const messageInput = screen.getByPlaceholderText(/special requests|additional message/i);
      const submitButton = screen.getByRole('button', { name: /book|request|submit/i });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const dateString = futureDate.toISOString().split('T')[0];

      await userEvent.type(dateInput, dateString);
      await userEvent.type(timeInput, '14:00');
      await userEvent.type(messageInput, 'Flexible timing');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            listingId: '123',
            date: expect.any(String),
            time: expect.stringContaining('14:00'),
            message: 'Flexible timing',
          })
        );
      });
    });

    test('should show loading state while submitting', async () => {
      const slowOnSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={slowOnSubmit}
        />
      );

      const dateInput = screen.getByLabelText(/select date/i);
      const timeInput = screen.getByLabelText(/select time/i);
      const submitButton = screen.getByRole('button', { name: /book|request|submit/i });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().split('T')[0];

      await userEvent.type(dateInput, dateString);
      await userEvent.type(timeInput, '09:00');
      fireEvent.click(submitButton);

      expect(screen.getByText(/booking|submitting/i)).toBeInTheDocument();
    });
  });

  // TEST 5: Shows success message
  describe('Success Feedback', () => {
    test('should show success message after booking', async () => {
      const { rerender } = render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /book|request|submit/i });
      fireEvent.click(submitButton);

      // Simulate successful submission
      rerender(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          success={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/success|confirmed|request sent/i)).toBeInTheDocument();
      });
    });

    test('should display checkmark or success icon', async () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          success={true}
        />
      );

      const successIcon = screen.queryByRole('img', { hidden: true });
      expect(successIcon || screen.getByText(/✓|success/i)).toBeInTheDocument();
    });
  });

  // TEST 6: Redirects to bookings page
  describe('Navigation', () => {
    test('should close modal on close button click', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close|×/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should close modal on backdrop click', () => {
      const { container } = render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const backdrop = container.querySelector('[class*="backdrop"]') || 
                      container.querySelector('[class*="overlay"]');
      
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    test('should not close modal when clicking inside modal content', () => {
      render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const title = screen.getByText('Beautiful Villa');
      fireEvent.click(title);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('should auto-close after successful booking', async () => {
      const { rerender } = render(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Simulate successful submission
      const submitButton = screen.getByRole('button', { name: /book|request|submit/i });
      fireEvent.click(submitButton);

      rerender(
        <BookingModal
          isOpen={true}
          listing={mockListing}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          success={true}
        />
      );

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });
});
