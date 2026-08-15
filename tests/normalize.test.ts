import { describe, expect, it } from "vitest";
import { mflError, textValue, toArray } from "../src/mfl/normalize.js";

describe("normalize helpers", () => {
  it("normalizes single and array values", () => {
    expect(toArray("x")).toEqual(["x"]);
    expect(toArray(["x"])).toEqual(["x"]);
    expect(toArray(undefined)).toEqual([]);
  });

  it("extracts text values", () => {
    expect(textValue("abc")).toBe("abc");
    expect(textValue({ $t: "hello" })).toBe("hello");
  });

  it("reads MFL error payloads", () => {
    expect(mflError({ error: { $t: "bad request" } })).toBe("bad request");
    expect(mflError({ ok: true })).toBeNull();
  });
});
