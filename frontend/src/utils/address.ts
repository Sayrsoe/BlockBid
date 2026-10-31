export function shortenAddress(address: string, visibleCharacters = 4): string {
  if (address.length <= visibleCharacters * 2 + 2) {
    return address;
  }

  return `${address.slice(0, visibleCharacters + 2)}…${address.slice(-visibleCharacters)}`;
}
