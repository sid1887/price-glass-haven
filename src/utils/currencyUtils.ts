
import { Country } from '@/components/CountrySelector';

interface ExchangeRates {
  [key: string]: number;
}

// Approximate exchange rates relative to USD (as of March 2025)
// These would ideally come from an API in a production app
const EXCHANGE_RATES: ExchangeRates = {
  "USD": 1.00,
  "EUR": 0.92,
  "GBP": 0.78,
  "JPY": 110.21,
  "AUD": 1.53,
  "CAD": 1.36,
  "CHF": 0.89,
  "CNY": 6.47,
  "HKD": 7.77,
  "NZD": 1.65,
  "SEK": 10.52,
  "KRW": 1186.45,
  "SGD": 1.34,
  "NOK": 10.73,
  "MXN": 20.27,
  "INR": 82.95,
  "RUB": 74.53,
  "ZAR": 18.66,
  "TRY": 29.83,
  "BRL": 5.17,
  "TWD": 27.98,
  "DKK": 6.86,
  "PLN": 4.25,
  "THB": 33.28,
  "IDR": 14350.65,
  "HUF": 345.84,
  "CZK": 23.31,
  "ILS": 3.62,
  "CLP": 813.70,
  "PHP": 54.82,
  "AED": 3.67,
  "COP": 3900.57,
  "SAR": 3.75,
  "MYR": 4.61,
  "RON": 4.57,
  "NGN": 820.25,
  "BDT": 110.32,
  "PKR": 280.15,
  "VND": 24950.75,
  "EGP": 30.95,
  "PEN": 3.72
};

// Get the currently selected country
export const getSelectedCountry = (): Country => {
  // Try to get from localStorage
  const storedCountryCode = localStorage.getItem('selectedCountry');
  if (storedCountryCode) {
    // Need to get the country data from somewhere
    // This is a simplified approach
    const countryData = window.COUNTRIES?.find((c: Country) => c.code === storedCountryCode);
    if (countryData) {
      return countryData;
    }
  }
  
  // Default to India if no country is selected
  return {
    name: "India",
    code: "IN",
    currency: {
      code: "INR",
      symbol: "₹",
      name: "Indian Rupee"
    },
    flag: "🇮🇳"
  };
};

// Convert a price from USD to the selected currency
export const convertPrice = (priceString: string, targetCurrency: string = 'INR'): string => {
  // Remove any existing currency symbols and commas
  const numericValue = parseFloat(priceString.replace(/[^0-9.]/g, ''));
  
  if (isNaN(numericValue)) {
    return priceString; // Return original if not a valid number
  }
  
  // Get exchange rate (default to 1 if not found)
  const exchangeRate = EXCHANGE_RATES[targetCurrency] || 1;
  
  // Convert the price
  const convertedPrice = numericValue * exchangeRate;
  
  // Get the currently selected country for formatting
  const selectedCountry = getSelectedCountry();
  
  // Format with the correct currency symbol
  return formatPrice(convertedPrice, selectedCountry.currency.symbol, targetCurrency);
};

// Format a price with the correct currency symbol and thousands separators
export const formatPrice = (
  price: number, 
  currencySymbol: string = '₹', 
  currencyCode: string = 'INR'
): string => {
  let formattedPrice: string;
  
  // Special formatting for different currencies
  switch(currencyCode) {
    case 'INR':
      // Indian format: ₹ 1,23,456.78
      formattedPrice = price.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      });
      break;
    case 'JPY':
    case 'KRW':
      // No decimal places for Yen and Won
      formattedPrice = Math.round(price).toLocaleString();
      break;
    default:
      // Standard international format
      formattedPrice = price.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      });
  }
  
  return `${currencySymbol}${formattedPrice}`;
};

// Expose a global variable to access countries data across the app
// This is a simplified approach - in a larger app we would use context
declare global {
  interface Window {
    COUNTRIES?: any[];
  }
}
