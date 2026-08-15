type Json = Record<string, unknown>;

export function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$t" in (value as Json)) {
    const text = (value as Json).$t;
    return typeof text === "string" ? text : "";
  }
  return "";
}

export function mflError(payload: unknown): string | null {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("error" in (payload as Json))
  ) {
    return null;
  }
  const error = (payload as Json).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "$t" in (error as Json)) {
    return textValue((error as Json).$t);
  }
  return "Unknown MFL API error";
}
