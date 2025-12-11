export type Currency = "EUR" | "CHF";

export const formatPrice = (priceCents: number, currency: Currency = "CHF") => {
  const price = priceCents / 100;
  
  switch (currency) {
    case "CHF":
      return `${price.toFixed(2)} CHF`;
    case "EUR":
    default:
      return `${price.toFixed(2)} €`;
  }
};

export const getCurrencySymbol = (currency: Currency) => {
  switch (currency) {
    case "CHF":
      return "CHF";
    case "EUR":
    default:
      return "€";
  }
};

export const formatCurrency = (amount: number, currency: Currency = "CHF") => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};