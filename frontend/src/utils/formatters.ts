export function formatPrice(price: number): string {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBalance(amount: number): string {
  if (amount === 0) return "0.00";
  if (Math.abs(amount) >= 1) {
    return amount.toFixed(2);
  }
  return amount.toPrecision(4);
}

export function formatCurrency(amount: number, currency: string): string {
  return `${formatBalance(amount)} ${currency}`;
}