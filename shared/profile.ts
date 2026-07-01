/**
 * Profile routing and display helpers shared by web and mobile.
 */

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function isEthAddress(value: string): boolean {
  return ETH_ADDRESS_RE.test(value);
}

/** Normalize a profile route param: 0x addresses → address route segment. */
export function normalizeProfileParam(
  param: string,
): { type: "address"; value: string } | { type: "username"; value: string } {
  if (isEthAddress(param)) {
    return { type: "address", value: param.toLowerCase() };
  }
  return { type: "username", value: param };
}
