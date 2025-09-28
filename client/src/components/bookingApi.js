// features/temp/api.js
// import { bearerToken } from '../components/tokens';
// import { useAuth } from '../../../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

const BASE_URL = 'http://127.0.0.1:5000/api';


export async function fetchSpaceById(id) {
  const response = await fetch(`${BASE_URL}/spaces/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch space details');
  }
  return response.json();
}

export async function createBooking(bookingData, bearerToken) {
  const response = await fetch(`${BASE_URL}/bookings/`, {
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
