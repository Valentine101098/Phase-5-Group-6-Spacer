export function calculateTotalAmount({ startDate, endDate, startTime, endTime, pricePerHour }) {
  if (!startDate || !endDate || !startTime || !endTime || !pricePerHour) return 0;

  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  const diffInHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

  return Math.max(0, Math.round(diffInHours * parseFloat(pricePerHour)));
}
