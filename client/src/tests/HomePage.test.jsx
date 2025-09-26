// src/components/HomePage.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../components/HomePage';

// Mock fetch globally
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

const mockSpacesData = [
  {
    id: 1,
    name: 'Modern Office Space',
    location: 'Westlands, Nairobi',
    rent: 50000,
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  },
  {
    id: 2,
    name: 'Co-working Hub',
    location: 'Karen, Nairobi',
    rent: 25000,
    images: '["https://example.com/image3.jpg"]'
  }
];

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the hero section with correct content', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText(/Find Your Perfect Working Environment\/Space in Nairobi/i)).toBeInTheDocument();
    expect(screen.getByText(/Discover quality rental work spaces from verified owners/i)).toBeInTheDocument();
  });

  it('renders features section', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('Why Choose SpaceHub?')).toBeInTheDocument();
    expect(screen.getByText('Quality Spaces')).toBeInTheDocument();
    expect(screen.getByText('Secure Platform')).toBeInTheDocument();
    expect(screen.getByText('Community Focused')).toBeInTheDocument();
  });


  it('displays spaces when fetch is successful', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Modern Office Space')).toBeInTheDocument();
      expect(screen.getByText('Co-working Hub')).toBeInTheDocument();
      expect(screen.getByText('Westlands, Nairobi')).toBeInTheDocument();
      expect(screen.getByText('Karen, Nairobi')).toBeInTheDocument();
    });

    expect(screen.getByText('2 available spaces')).toBeInTheDocument();
  });

  it('displays error message when fetch fails', async () => {
    const errorMessage = 'HTTP error! status: 500, Body: Server Error';
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error'
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load properties. Please try again later.')).toBeInTheDocument();
    });
  });

  it('displays no spaces message when array is empty', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('No spaces currently available')).toBeInTheDocument();
    });
  });

  it('handles network error correctly', async () => {
    fetch.mockRejectedValueOnce(new Error('Network Error'));

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load properties. Please try again later.')).toBeInTheDocument();
    });
  });

  it('formats rent prices correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Ksh 50,000')).toBeInTheDocument();
      expect(screen.getByText('Ksh 25,000')).toBeInTheDocument();
    });
  });

  it('handles image error with fallback', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      const firstImage = images.find(img => img.alt === 'Modern Office Space');

      if (firstImage) {
        fireEvent.error(firstImage);
        expect(firstImage.src).toBe('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop');
      }
    });
  });

  it('renders call to action section', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
    expect(screen.getByText('Sign Up Today')).toBeInTheDocument();
    expect(screen.getByText('Already a Member?')).toBeInTheDocument();
  });

  it('navigates to correct space detail page when space is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      const spaceLinks = screen.getAllByText('View Details →');
      expect(spaceLinks[0].closest('a')).toHaveAttribute('href', '/api/spaces/1');
    });
  });

  it('handles JSON parsing error in images', async () => {
    const spacesWithInvalidJson = [{
      id: 1,
      name: 'Test Space',
      location: 'Nairobi',
      rent: 30000,
      images: 'invalid json'
    }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => spacesWithInvalidJson
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Space')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Invalid pictures JSON:', 'invalid json');
    consoleSpy.mockRestore();
  });

  it('displays location information correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('Nairobi, Kenya')).toBeInTheDocument();
  });

  it('shows featured badge on all spaces', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      const featuredBadges = screen.getAllByText('Featured');
      expect(featuredBadges).toHaveLength(2);
    });
  });

  it('shows available status on all spaces', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpacesData
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      const availableBadges = screen.getAllByText('Available');
      expect(availableBadges).toHaveLength(2);
    });
  });
});