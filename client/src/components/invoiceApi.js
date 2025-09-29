// import { bearerToken } from '../components/tokens';
import { API_BASE_URL } from "../config/api";

// const BASE_URL = 'http://127.0.0.1:5000/api';

export async function fetchInvoiceById(id, bearerToken) {
  const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch invoice details');
  }
  return response.json();
}

export async function validateInvoicePayment(id, confirmationCode, bearerToken) {
  const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({ payment_complete_id: confirmationCode }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Payment validation failed');
  }
  return data;
}