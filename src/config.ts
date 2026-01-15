export const IGNORED_DEVICE_NUMBERS = [
  // Source/sender device used in training / ground-truth data. Exclude from heuristic/statistics to avoid bias.
  "971526756657",
];

export function isIgnored(deviceNumber: string): boolean {
  if (!deviceNumber) return false;
  return IGNORED_DEVICE_NUMBERS.includes(String(deviceNumber));
}
