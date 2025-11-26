/**
 * Format a location string to display city names with title case.
 * Input: "HOKKSUND, 3300" or "Hokksund, 3300"
 * Output: "Hokksund, 3300"
 */
export function formatLocation(location: string): string {
  if (!location || typeof location !== 'string') {
    return location;
  }

  // Split by comma to separate city from postal code
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length === 0) {
    return location;
  }

  // Apply title case to the city name (first part)
  const city = parts[0];
  const formattedCity = city.toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase());

  // Rejoin with the postal code if it exists
  if (parts.length > 1) {
    return `${formattedCity}, ${parts.slice(1).join(', ')}`;
  }

  return formattedCity;
}
