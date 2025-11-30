// Currency utility functions and data

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
]

// Exchange rates (mock data - in production, fetch from API)
const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CNY: 7.24,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  INR: 83.12,
  KRW: 1320.50,
  BRL: 4.97,
  RUB: 92.50,
  ZAR: 18.75,
  MXN: 17.08,
  SGD: 1.34,
  HKD: 7.83,
  NOK: 10.68,
  SEK: 10.52,
  DKK: 6.87,
  PLN: 3.98,
  THB: 35.42,
  IDR: 15625,
  MYR: 4.68,
  PHP: 56.25,
  AED: 3.67,
  SAR: 3.75,
  TRY: 28.75,
  NZD: 1.64
}

export const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode)
  return currency ? currency.symbol : '$'
}

export const getCurrencyName = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode)
  return currency ? currency.name : 'US Dollar'
}

export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency]
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency]
  
  return convertedAmount
}

export const formatCurrency = (amount, currencyCode = 'USD', decimals = 2) => {
  const symbol = getCurrencySymbol(currencyCode)
  const formattedAmount = Math.abs(amount).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return `${symbol}${formattedAmount}`
}

export const getUserCurrency = () => {
  return localStorage.getItem('userCurrency') || 'USD'
}

export const setUserCurrency = (currencyCode) => {
  localStorage.setItem('userCurrency', currencyCode)
}
