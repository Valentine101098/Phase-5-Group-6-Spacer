import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SpaceDetails from '../components/SpaceDetails';
import * as AuthContext from '../contexts/AuthContext';

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock API_BASE_URL
vi.mock('../config/api', () => ({
    API_BASE_URL: 'http://localhost:5000'
}));

const mockSpace = {
    id: 1,
    title: 'Conference Room A',
    description: 'A spacious conference room',
    space_type: 'Meeting Room',
    max_guests: 20,
    price_per_hour: 50.00,
    status: 'available',
    images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
    ]
};

const mockReviews = [
    {
        id: 1,
        user_id: 2,
        rating: 5,
        comment: 'Great space!',
        user: { first_name: 'John' }
    }
];

const mockBookings = {
    data: [
        {
            id: 1,
            space_id: 1,
            user_id: 3,
            status: 'confirmed'
        }
    ]
};

describe('SpaceDetails Component', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockClear();
    });

    const renderComponent = (user = null, accessToken = null) => {
        AuthContext.useAuth.mockReturnValue({ user, accessToken });
        return render(
            <BrowserRouter>
                <SpaceDetails space={mockSpace} onClose={mockOnClose} />
            </BrowserRouter>
        );
    };

    test('1. renders space details correctly', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => mockReviews
        });

        renderComponent();

        expect(screen.getByText('Conference Room A')).toBeInTheDocument();
        expect(screen.getByText('A spacious conference room')).toBeInTheDocument();
        expect(screen.getByText('Meeting Room')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('50.00')).toBeInTheDocument();
    });

    test('2. displays reviews when available', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => mockReviews
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Great space!')).toBeInTheDocument();
            expect(screen.getByText(/John/)).toBeInTheDocument();
        });
    });

    test('3. shows Add Review button only for clients with bookings', async () => {
        const clientUser = { id: 3, roles: ['client'] };

        fetch
            .mockResolvedValueOnce({ json: async () => mockReviews })
            .mockResolvedValueOnce({ json: async () => mockBookings });

        renderComponent(clientUser, 'mock-token');

        await waitFor(() => {
            expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
    });

    test('4. hides Add Review button for admin users', async () => {
        const adminUser = { id: 4, roles: ['admin'] };

        fetch
            .mockResolvedValueOnce({ json: async () => mockReviews })
            .mockResolvedValueOnce({ json: async () => mockBookings });

        renderComponent(adminUser, 'mock-token');

        await waitFor(() => {
            expect(screen.queryByText('Add Review')).not.toBeInTheDocument();
        });
    });

    test('5. hides Add Review button for owner users', async () => {
        const ownerUser = { id: 5, roles: ['owner'] };

        fetch
            .mockResolvedValueOnce({ json: async () => mockReviews })
            .mockResolvedValueOnce({ json: async () => mockBookings });

        renderComponent(ownerUser, 'mock-token');

        await waitFor(() => {
            expect(screen.queryByText('Add Review')).not.toBeInTheDocument();
        });
    });

    test('6. navigates through image gallery correctly', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => mockReviews
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('1 / 2')).toBeInTheDocument();
        });

        const nextButton = screen.getAllByRole('button').find(btn =>
            btn.querySelector('svg') && btn.className.includes('right-2')
        );

        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('2 / 2')).toBeInTheDocument();
        });

        const prevButton = screen.getAllByRole('button').find(btn =>
            btn.querySelector('svg') && btn.className.includes('left-2')
        );

        fireEvent.click(prevButton);

        await waitFor(() => {
            expect(screen.getByText('1 / 2')).toBeInTheDocument();
        });
    });
});