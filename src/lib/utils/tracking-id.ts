/**
 * Generate a white label tracking ID in the format GT + 8 alphanumeric characters
 * Example: GT4A7B2C3D
 */
export function generateWhiteLabelTrackingId(): string {
  const prefix = 'GT';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  // Generate 8 random alphanumeric characters
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
/**
 * Validate a white label tracking ID format
 * @param trackingId - The tracking ID to validate
 * @returns boolean - Whether the format is valid
 */
export function validateWhiteLabelTrackingId(trackingId: string): boolean {
  // Check if it starts with GT and has exactly 8 alphanumeric characters after
  const pattern = /^GT[A-Z0-9]{8}$/;
  return pattern.test(trackingId);
}
/**
 * Check if a tracking ID is a white label tracking ID
 * @param trackingId - The tracking ID to check
 * @returns boolean - Whether it's a white label tracking ID
 */
export function isWhiteLabelTrackingId(trackingId: string): boolean {
  return trackingId.startsWith('GT') && trackingId.length === 10;
}
