/**
 * Recreates the EIP-4361 / CAIP-122 login message from a thirdweb LoginPayload.
 * Mirrors thirdweb's internal `createLoginMessage` so the string we pass to
 * `signIn("ethereum", { message })` matches exactly what the wallet signed.
 */
type LoginPayload = {
  domain: string;
  address: string;
  statement?: string;
  uri?: string;
  version: string;
  chain_id?: string | number;
  nonce: string;
  issued_at: string;
  expiration_time: string;
  invalid_before?: string;
  resources?: string[];
};

export function createLoginMessage(payload: LoginPayload): string {
  const typeField = "Ethereum";
  const header = `${payload.domain} wants you to sign in with your ${typeField} account:`;
  let prefix = [header, payload.address].join("\n");
  prefix = [prefix, payload.statement ?? ""].join("\n\n");
  if (payload.statement) {
    prefix += "\n";
  }

  const suffixArray: string[] = [];
  if (payload.uri) suffixArray.push(`URI: ${payload.uri}`);
  suffixArray.push(`Version: ${payload.version}`);
  if (payload.chain_id) suffixArray.push(`Chain ID: ${payload.chain_id}`);
  suffixArray.push(`Nonce: ${payload.nonce}`);
  suffixArray.push(`Issued At: ${payload.issued_at}`);
  suffixArray.push(`Expiration Time: ${payload.expiration_time}`);
  if (payload.invalid_before) suffixArray.push(`Not Before: ${payload.invalid_before}`);
  if (payload.resources) {
    suffixArray.push(["Resources:", ...payload.resources.map((x) => `- ${x}`)].join("\n"));
  }

  return [prefix, suffixArray.join("\n")].join("\n");
}
