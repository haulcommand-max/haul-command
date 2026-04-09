export function isLikelyCountryCode(value: string): boolean {
  return /^[a-z]{2}$/i.test(value);
}

export function uppercaseCountryCode(value: string): string {
  return value.toUpperCase();
}
