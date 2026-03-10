export function timeRangeToDays(timeRange: string) {
  switch (timeRange) {
    case "90d":
      return 90
    case "30d":
      return 30
    case "7d":
      return 7
    case "1d":
      return 24 / 24 // 1 day
    case "12hr":
      return 12 / 24 // 2 hours in days
    case "6hr":
      return 6 / 24 // 2 hours in days
    case "2hr":
      return 2 / 24 // 2 hours in days
    case "1hr":
      return 1 / 24 // 1 hour in days
    case "30mn":
      return 0.5 / 24 // 30 minutes in days
    case "15mn":
      return 0.25 / 24 // 15 minutes in days
    case "5mn":
      return (5 / 60) / 24 // 5 minutes in days
    default:
      return 90 // default fallback
  }
}

// Function to get display label for time range
export function getTimeRangeLabel(timeRange: string) {
  switch (timeRange) {
    case "90d":
      return "Last 3 months"
    case "30d":
      return "Last 30 days"
    case "7d":
      return "Last 7 days"
    case "1d":
      return "Last 24 hours"
    case "12hr":
      return "Last 12 hours"
    case "6hr":
      return "Last 6 hours"
    case "2hr":
      return "Last 2 hours"
    case "1hr":
      return "Last 60 mins"
    case "30mn":
      return "Last 30 mins"
    case "15mn":
      return "Last 15 mins"
    case "5mn":
      return "Last 5 mins"
    default:
      return "Last 3 months"
  }
}

export function formatPrice({
  amount,
  currency = 'NGN',
  isKobo = true
}: {
  amount: number | string
  currency?: string
  isKobo?: boolean

}): string {
  // 1. Convert to number if it's a string from the DB
  const rawValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  // 2. Adjust for kobo (smallest unit) if necessary
  const baseAmount = isKobo ? rawValue / 100 : rawValue;
  // 3. Format based on locale
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(baseAmount);
}

export const formatNumbers = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    useGrouping: true,
  }).format(price)
}

/**
 * Formats a value (number or string) to a fixed number of decimal places (default 2).
 * Handles null, undefined, or invalid input by returning "0.00".
 * This is ideal for displaying financial holdings or balances.
 */
export const formatHolding = (value: number | string | null | undefined, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value as number);
  const safeNum = isNaN(num) || num === null || num === undefined ? 0 : num;

  return safeNum.toFixed(decimals);
};

export const pastWeek = () => {
  return new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).getTime()
}

export const pastMonth = () => {
  return new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).getTime()
}

export const pastYear = () => {
  return new Date(new Date().getTime() - 12 * 30 * 24 * 60 * 60 * 1000).getTime()
}

export const today = () => {
  return new Date().getTime()
}

/**
 * Checks if a given URL resolves to a valid, loadable image.
 * @param url The image URL to check.
 * @param timeoutMs Optional timeout in milliseconds (defaults to 5000ms).
 * @returns A Promise that resolves to true if the image is accessible, false otherwise.
 */
export const checkImageAccessibility = (
  url: string,
  timeoutMs: number = 5000
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return resolve(false);
    }

    const img = new Image();

    // Success: The image loaded correctly
    img.onload = () => {
      // Check if the image has a non-zero size to filter out invalid placeholders
      if (img.width > 1 && img.height > 1) {
        clearTimeout(timeoutId); // Clear timeout if image loads successfully
        resolve(true);
      } else {
        clearTimeout(timeoutId);
        resolve(false);
      }
    };

    // Failure: The image failed to load (404, connection error, etc.)
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };

    // Set the source to start the loading process
    img.src = url;

    // Set a timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      img.src = ""; // Abort the image load
      resolve(false);
    }, timeoutMs);
  });
};

/**
 * Parses an ISO date string and returns formatted date if older than specified threshold.
 * It determines and uses the user's local timezone (e.g., "PST", "WAT", etc.) for formatting.
 * @param dateString - ISO date string (e.g., "2025-11-21T11:10:20.930Z")
 * @param yearsThreshold - Number of years to check against (default: 1)
 * @returns Formatted date string (e.g., "Nov 21, 2023, 12:13 PM WAT") if older than threshold, null otherwise
 */
export function formatDateIfOlderThanThreshold(
  dateString: string,
) {
  try {
    const date = new Date(dateString)
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Use Intl.DateTimeFormat to reliably format the date and include the timezone.
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimeZone,
      timeZoneName: 'short', // Includes the timezone abbreviation (e.g., PST, GMT, WAT)
    });

    // The output will be something like: "Nov 21, 2024, 12:13 PM WAT"
    return formatter.format(date);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}