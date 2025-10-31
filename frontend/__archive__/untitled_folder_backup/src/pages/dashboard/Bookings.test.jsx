import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Bookings from './Bookings';

/**
 * Bookings Dashboard Page Tests
 * TDD: Write tests first, implement component after
 * 
 * Test cases for the user bookings dashboard page
 */

const mockBookings = [
  {
    id: '1',
    listing: {
      id: 'list-1',
      title: 'Beautiful Villa',
      location: 'Kyrenia',
      price: 150,
      currency: 'EUR',
      image_url: 'https://example.com/villa.jpg',
    },
    preferred_date: '2025-10-25',
    preferred_time: '10:00',
    message: 'Looking forward to viewing',
    status: 'pending',
    agent_response: '',
    agent_available_times: [],
    agent_notes: '',
    created_at: '2025-10-21T10:00:00',
    confirmed_at: null,
  },
  {
    id: '2',
    listing: {
      id: 'list-2',
      title: 'Cozy Apartment',
      location: 'Nicosia',
      price: 100,
      currency: 'EUR',
      image_url: 'https://example.com/apt.jpg',
    },
    preferred_date: '2025-10-26',
    preferred_time: '14:00',
    message: 'Flexible timing',
    status: 'confirmed',
    agent_response: 'Confirmed for 2pm',
    agent_available_times: ['14:00', '15:00'],
    agent_notes: 'Please bring ID',
    created_at: '2025-10-20T10:00:00',
    confirmed_at: '2025-10-20T15:30:00',
  },
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Bookings Dashboard Page', () => {
  // TEST 1: Loads user's bookings on mount
  describe('Booking Load', () => {
    test('should display loading state on mount', () => {
      renderWithRouter(<Bookings />);
      
      const loadingElement = screen.queryByText(/loading|loading bookings/i);
      expect(loadingElement || screen.queryByRole('progressbar')).toBeInTheDocument();
    });

    test('should load bookings from API on mount', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: mockBookings }),
        })
      );

      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Beautiful Villa')).toBeInTheDocument();
      });
    });

    test('should display error message if fetch fails', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Failed to fetch'))
      );

      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    test('should display empty state when no bookings exist', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: [] }),
        })
      );

      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText(/no bookings|empty/i)).toBeInTheDocument();
      });
    });
  });

  // TEST 2: Displays booking list with status
  describe('Booking List Display', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: mockBookings }),
        })
      );
    });

    test('should display booking list', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Beautiful Villa')).toBeInTheDocument();
        expect(screen.getByText('Cozy Apartment')).toBeInTheDocument();
      });
    });

    test('should display booking details (location, price, date)', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Kyrenia')).toBeInTheDocument();
        expect(screen.getByText('Nicosia')).toBeInTheDocument();
        expect(screen.getByText(/€150/)).toBeInTheDocument();
        expect(screen.getByText(/€100/)).toBeInTheDocument();
      });
    });

    test('should display booking status', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        const pendingStatus = screen.getByText(/pending/i);
        const confirmedStatus = screen.getByText(/confirmed/i);
        expect(pendingStatus).toBeInTheDocument();
        expect(confirmedStatus).toBeInTheDocument();
      });
    });

    test('should display booking date and time', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText(/10:00/)).toBeInTheDocument();
        expect(screen.getByText(/14:00/)).toBeInTheDocument();
      });
    });
  });

  // TEST 3: Shows seller response when available
  describe('Seller Response Display', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: mockBookings }),
        })
      );
    });

    test('should not show response for pending bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        const bookingCards = screen.getAllByRole('article', { hidden: true }) || 
                            screen.getAllByTestId(/booking-card/i);
        
        // First card (pending) should not have agent response
        expect(screen.queryByText('Confirmed for 2pm')).not.toBeInTheDocument();
      });
    });

    test('should show agent response for confirmed bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Confirmed for 2pm')).toBeInTheDocument();
      });
    });

    test('should show agent notes when available', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Please bring ID')).toBeInTheDocument();
      });
    });

    test('should show available times from agent', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        const availableTimes = screen.getByText(/14:00|15:00/);
        expect(availableTimes).toBeInTheDocument();
      });
    });
  });

  // TEST 4: Can cancel pending booking
  describe('Cancel Booking', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: mockBookings }),
        })
      );
    });

    test('should display cancel button for pending bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
        expect(cancelButtons.length).toBeGreaterThan(0);
      });
    });

    test('should not display cancel button for confirmed bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const cancelButtons = buttons.filter(btn => 
          btn.textContent.toLowerCase().includes('cancel')
        );
        // Only one cancel button for the pending booking
        expect(cancelButtons.length).toBe(1);
      });
    });

    test('should call cancel API when cancel button clicked', async () => {
      global.fetch = jest.fn()
        .mockImplementation((url) => {
          if (url.includes('DELETE') || url.includes('cancel')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ bookings: mockBookings }),
          });
        });

      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Beautiful Villa')).toBeInTheDocument();
      });

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/bookings/1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    test('should show success message after cancellation', async () => {
      global.fetch = jest.fn()
        .mockImplementation((url) => {
          if (url.includes('DELETE') || url.includes('cancel')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, message: 'Booking cancelled' }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ bookings: mockBookings }),
          });
        });

      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Beautiful Villa')).toBeInTheDocument();
      });

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText(/cancelled|success/i)).toBeInTheDocument();
      });
    });
  });

  // TEST 5: Shows confirmation date when confirmed
  describe('Confirmation Display', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: mockBookings }),
        })
      );
    });

    test('should show confirmation date for confirmed bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText(/2025-10-20|october 20/i)).toBeInTheDocument();
      });
    });

    test('should show "pending" indicator for unconfirmed bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
    });

    test('should show confirmed status badge differently', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        const confirmedBadge = screen.getByText(/confirmed/i);
        expect(confirmedBadge).toHaveClass(/confirmed|success|green/i);
      });
    });
  });

  // TEST 6: Displays completed bookings with review option
  describe('Completed Bookings', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            bookings: [
              ...mockBookings,
              {
                id: '3',
                listing: {
                  id: 'list-3',
                  title: 'Beach House',
                  location: 'Famagusta',
                  price: 200,
                  currency: 'EUR',
                  image_url: 'https://example.com/beach.jpg',
                },
                preferred_date: '2025-09-15',
                preferred_time: '11:00',
                message: '',
                status: 'completed',
                agent_response: 'Great viewing!',
                agent_available_times: [],
                agent_notes: '',
                created_at: '2025-09-10T10:00:00',
                confirmed_at: '2025-09-10T15:00:00',
              },
            ],
          }),
        })
      );
    });

    test('should display completed bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText('Beach House')).toBeInTheDocument();
      });
    });

    test('should show completed status', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    test('should display review button for completed bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        const reviewButtons = screen.queryAllByRole('button', { name: /review|rate|feedback/i });
        expect(reviewButtons.length).toBeGreaterThan(0);
      });
    });

    test('should filter or separate completed bookings', async () => {
      renderWithRouter(<Bookings />);

      await waitFor(() => {
        // Should have section or filter for completed bookings
        expect(screen.queryByText(/completed|history/i)).toBeInTheDocument();
      });
    });
  });

  // Additional: Page structure tests
  describe('Page Structure', () => {
    test('should have page title', () => {
      renderWithRouter(<Bookings />);

      expect(screen.getByRole('heading', { name: /bookings|my bookings/i })).toBeInTheDocument();
    });

    test('should have filter or sort options', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: mockBookings }),
        })
      );

      renderWithRouter(<Bookings />);

      await waitFor(() => {
        // Check for filter/sort buttons or dropdowns
        const filters = screen.queryAllByRole('button') || 
                       screen.queryAllByRole('combobox');
        expect(filters.length).toBeGreaterThan(0);
      });
    });

    test('should be responsive on mobile', () => {
      renderWithRouter(<Bookings />);

      const mainElement = screen.getByRole('main', { hidden: true }) ||
                         screen.getByTestId(/bookings-page/i);
      
      expect(mainElement).toHaveClass(/responsive|mobile|flex/i);
    });
  });
});
