import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingCalendar from './BookingCalendar';

/**
 * BookingCalendar Component Tests
 * TDD: Write tests first, implement component after
 * 
 * Test cases for the calendar date picker used in booking flow
 */

describe('BookingCalendar Component', () => {
  const mockOnDateSelect = jest.fn();
  const mockOnTimeSelect = jest.fn();

  beforeEach(() => {
    mockOnDateSelect.mockClear();
    mockOnTimeSelect.mockClear();
  });

  // TEST 1: Calendar renders with correct month
  describe('Calendar Rendering', () => {
    test('should render calendar with current month', () => {
      const { container } = render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      const currentDate = new Date();
      const monthName = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();

      expect(screen.getByText(new RegExp(`${monthName}.*${year}`, 'i'))).toBeInTheDocument();
    });

    test('should render previous and next month navigation buttons', () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    test('should render all days of the week as headers', () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      daysOfWeek.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });
  });

  // TEST 2: Can select date from calendar
  describe('Date Selection', () => {
    test('should call onDateSelect when a date is clicked', async () => {
      const { container } = render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      // Find and click a date (using data-testid or accessible text)
      const dateButtons = screen.getAllByRole('button');
      // Find first clickable date (not prev/next buttons)
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          expect(mockOnDateSelect).toHaveBeenCalled();
        });
      }
    });

    test('should highlight selected date', async () => {
      const { rerender } = render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);
        
        await waitFor(() => {
          expect(dateButton).toHaveClass('selected', 'bg-brand', 'text-white');
        });
      }
    });

    test('should not allow selecting dates in the past', () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      // Past dates should be disabled
      const pastDateElements = screen.queryAllByRole('button', { disabled: true });
      expect(pastDateElements.length).toBeGreaterThan(0);
    });
  });

  // TEST 3: Time slots display for selected date
  describe('Time Slots Display', () => {
    test('should display time slots after date selection', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={['09:00', '10:00', '11:00', '14:00', '15:00']}
        />
      );

      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        await waitFor(() => {
          expect(screen.getByText('09:00')).toBeInTheDocument();
          expect(screen.getByText('10:00')).toBeInTheDocument();
          expect(screen.getByText('15:00')).toBeInTheDocument();
        });
      }
    });

    test('should show loading state while fetching time slots', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          isLoadingTimes={true}
        />
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('should show message when no time slots available', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={[]}
        />
      );

      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        await waitFor(() => {
          expect(screen.getByText(/no times available/i)).toBeInTheDocument();
        });
      }
    });
  });

  // TEST 4: Can select time slot
  describe('Time Selection', () => {
    test('should call onTimeSelect when a time slot is clicked', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={['09:00', '10:00', '11:00']}
        />
      );

      // First select a date
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        // Then select a time
        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        await waitFor(() => {
          expect(mockOnTimeSelect).toHaveBeenCalledWith('09:00');
        });
      }
    });

    test('should highlight selected time slot', async () => {
      const { rerender } = render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={['09:00', '10:00', '11:00']}
        />
      );

      // Select date first
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        // Select time
        const timeButton = await screen.findByText('10:00');
        fireEvent.click(timeButton);

        await waitFor(() => {
          expect(timeButton).toHaveClass('selected', 'bg-brand', 'text-white');
        });
      }
    });
  });

  // TEST 5: Booking confirmation modal appears
  describe('Confirmation Modal', () => {
    test('should display confirmation modal after date and time selection', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={['09:00', '10:00']}
        />
      );

      // Select date
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        // Select time
        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        // Confirmation modal should appear
        await waitFor(() => {
          expect(screen.getByText(/confirm booking/i)).toBeInTheDocument();
        });
      }
    });

    test('should show selected date and time in confirmation modal', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={['09:00']}
        />
      );

      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        const dateText = dateButton.textContent;
        fireEvent.click(dateButton);

        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        await waitFor(() => {
          expect(screen.getByText(/09:00/)).toBeInTheDocument();
        });
      }
    });

    test('should have confirm and cancel buttons in modal', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={['09:00']}
        />
      );

      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        });
      }
    });
  });

  // TEST 6: Can submit booking with message
  describe('Booking Submission', () => {
    test('should allow adding optional message before submitting', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          availableTimes={['09:00']}
        />
      );

      // Select date and time
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        // Type message
        const messageInput = await screen.findByPlaceholderText(/message/i);
        await userEvent.type(messageInput, 'I prefer afternoon viewings');

        expect(messageInput.value).toBe('I prefer afternoon viewings');
      }
    });

    test('should call onBookingSubmit when confirm button is clicked', async () => {
      const mockOnBookingSubmit = jest.fn();

      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          onBookingSubmit={mockOnBookingSubmit}
          availableTimes={['09:00']}
        />
      );

      // Select date and time
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        // Click confirm
        const confirmButton = await screen.findByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockOnBookingSubmit).toHaveBeenCalled();
        });
      }
    });

    test('should pass booking details to onBookingSubmit', async () => {
      const mockOnBookingSubmit = jest.fn();

      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          onBookingSubmit={mockOnBookingSubmit}
          availableTimes={['09:00']}
        />
      );

      // Select date and time
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        // Click confirm
        const confirmButton = await screen.findByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockOnBookingSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              date: expect.any(String),
              time: expect.stringContaining('09:00'),
              message: expect.any(String)
            })
          );
        });
      }
    });

    test('should show success message after booking submission', async () => {
      const mockOnBookingSubmit = jest.fn();

      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
          onBookingSubmit={mockOnBookingSubmit}
          availableTimes={['09:00']}
        />
      );

      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && parseInt(text) > 7;
      });

      if (dateButton) {
        fireEvent.click(dateButton);

        const timeButton = await screen.findByText('09:00');
        fireEvent.click(timeButton);

        const confirmButton = await screen.findByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(screen.getByText(/booking.*success|booking.*confirmed/i)).toBeInTheDocument();
        });
      }
    });
  });

  // TEST 7: Month navigation works
  describe('Month Navigation', () => {
    test('should display next month when next button is clicked', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthName = nextMonth.toLocaleString('default', { month: 'long' });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(monthName, 'i'))).toBeInTheDocument();
      });
    });

    test('should display previous month when previous button is clicked', async () => {
      render(
        <BookingCalendar 
          onDateSelect={mockOnDateSelect}
          onTimeSelect={mockOnTimeSelect}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);

      const currentDate = new Date();
      const monthName = currentDate.toLocaleString('default', { month: 'long' });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(monthName, 'i'))).toBeInTheDocument();
      });
    });
  });
});
