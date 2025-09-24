import { bearerToken } from '../components/tokens';

const BASE_URL = 'http://127.0.0.1:5000/api';

export async function fetchInvoiceById(id) {
  const response = await fetch(`${BASE_URL}/invoices/${id}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch invoice details');
  }
  return response.json();
}

export async function validateInvoicePayment(id, confirmationCode) {
  const response = await fetch(`${BASE_URL}/invoices/${id}`, {
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