
import { API_BASE_URL } from '../config/api';


export async function fetchSpaceById(id) {
  const response = await fetch(`${API_BASE_URL}/api/spaces/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch space details');
  }
  return response.json();
}

export async function createBooking(bookingData, bearerToken) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    },
    body: JSON.stringify(bookingData)
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.error || 'Failed to create booking');
  }
  return response.json();
}


// Fetch bookings
export async function fetchBookings({ page, sortKey, sortDirection, search, status }, bearerToken) {
  const params = new URLSearchParams({
    page: page.toString(),
    sort: sortKey,
    direction: sortDirection,
  });

  if (search) params.append('search', search);
  if (status !== 'all') params.append('status', status);

  const response = await fetch(`${API_BASE_URL}/api/bookings/?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Fetch booking statistics
export async function fetchBookingStats(bearerToken) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/stats`, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Stats fetch failed: ${response.status}`);
  }

  return response.json();
}

// Cancel a booking
export async function cancelBooking(bookingId, bearerToken) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to cancel booking');
  }

  return response.json();
}