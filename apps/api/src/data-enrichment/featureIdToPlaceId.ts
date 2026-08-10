export interface FeatureId {
  hexA: string;
  hexB: string;
}

/**
 * Derives a Google Place ID from the Feature ID embedded in a Maps URL
 * (`data=!4m2!3m1!1s0x<hexA>:0x<hexB>`).
 *
 * Undocumented by Google — reverse-engineered by decoding real Place IDs.
 * A Place ID is base64url of a small protobuf message:
 *   field 1 (LEN, length 18) {
 *     field 1 (fixed64) = hexA
 *     field 2 (fixed64) = hexB
 *   }
 * with hexA/hexB stored as raw 8-byte little-endian values, i.e. the bytes
 * `0a 12 09 <hexA LE> 11 <hexB LE>`, base64url-encoded.
 *
 * Confirmed against the live Places API for two independent real places
 * (Crema Gourmet, BITE of POWER) — not just that the decoding math lines up.
 */
export function featureIdToPlaceId(id: FeatureId): string {
  const strip0x = (hex: string) => hex.replace(/^0x/i, "");
  const toLittleEndianBytes = (hex: string): Buffer =>
    Buffer.from(hex.match(/../g)!.reverse().join(""), "hex");

  const bytes = Buffer.concat([
    Buffer.from([0x0a, 0x12, 0x09]),
    toLittleEndianBytes(strip0x(id.hexA)),
    Buffer.from([0x11]),
    toLittleEndianBytes(strip0x(id.hexB)),
  ]);

  return bytes.toString("base64url");
}
