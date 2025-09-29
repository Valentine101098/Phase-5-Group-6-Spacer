export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Ksh 0.00';
  return `Ksh. ${parseFloat(amount).toFixed(2)}`;
};