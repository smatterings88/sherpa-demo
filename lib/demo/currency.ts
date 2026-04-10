/**
 * US-style currency: $10,000 — no decimals when whole dollars.
 */
export function formatUsd(amount: number): string {
  const rounded = Math.round(amount);
  const hasCents = Math.abs(amount - rounded) > 1e-9;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}
