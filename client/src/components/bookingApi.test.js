// bookingApi.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchSpaceById,
  createBooking,
  fetchBookings,
  fetchBookingStats,
  cancelBooking
} from './bookingApi';
import { API_BASE_URL } from '../config/api';

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Booking API', () => {

  describe('fetchSpaceById', () => {
    it('should fetch space by ID successfully', async () => {
      const mockData = { id: 1, name: 'Space A' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchSpaceById(1);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/spaces/1`);
      expect(result).toEqual(mockData);
    });

    it('should throw an error if fetch fails', async () => {
      fetch.mockResolvedValueOnce({ ok: false });

      await expect(fetchSpaceById(1)).rejects.toThrow('Failed to fetch space details');
    });
  });

  describe('createBooking', () => {
    const bookingData = { spaceId: 1, userId: 42 };
    const token = 'fake-token';

    it('should create a booking successfully', async () => {
      const mockResponse = { id: 123, ...bookingData };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createBooking(bookingData, token);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw an error if server responds with error', async () => {
      const errorMsg = { error: 'Invalid booking' };
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorMsg,
      });

      await expect(createBooking(bookingData, token)).rejects.toThrow('Invalid booking');
    });
  });

  describe('fetchBookings', () => {
    const token = 'fake-token';
    const params = { page: 1, sortKey: 'date', sortDirection: 'asc', search: '', status: 'all' };

it('should fetch bookings successfully', async () => {
  const mockData = { results: [{ id: 1 }], total: 1 };
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockData,
  });

  const params = { page: 1, sortKey: 'date', sortDirection: 'asc', search: '', status: 'all' };
  const token = 'fake-token';

  const result = await fetchBookings(params, token);

  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    sort: params.sortKey,
    direction: params.sortDirection
  });
  if (params.search) searchParams.append('search', params.search);
  if (params.status !== 'all') searchParams.append('status', params.status);

  const expectedUrl = `${API_BASE_URL}/api/bookings/?${searchParams.toString()}`;

  expect(fetch).toHaveBeenCalledWith(expectedUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  expect(result).toEqual(mockData);
});


    it('should throw an error if fetch fails', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(fetchBookings(params, token)).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('fetchBookingStats', () => {
    const token = 'fake-token';

    it('should fetch booking stats successfully', async () => {
      const mockData = { total: 5, pending: 2 };
      fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const result = await fetchBookingStats(token);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/bookings/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockData);
    });

    it('should throw an error if stats fetch fails', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(fetchBookingStats(token)).rejects.toThrow('Stats fetch failed: 404');
    });
  });

  describe('cancelBooking', () => {
    const token = 'fake-token';
    const bookingId = 99;

    it('should cancel booking successfully', async () => {
      const mockData = { success: true };
      fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const result = await cancelBooking(bookingId, token);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockData);
    });

    it('should throw an error if cancel fails', async () => {
      fetch.mockResolvedValueOnce({ ok: false });

      await expect(cancelBooking(bookingId, token)).rejects.toThrow('Failed to cancel booking');
    });
  });

});
