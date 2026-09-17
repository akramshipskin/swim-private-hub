import { describe, expect, it } from "vitest";
import { matchesQuery } from "./search-form";

describe("matchesQuery", () => {
  it("matches everything when the query is empty", () => {
    expect(matchesQuery("", "Ayu")).toBe(true);
  });
  it("is case-insensitive substring match across values, ignoring nulls", () => {
    expect(matchesQuery("melati", null, "Kolam Renang Melati")).toBe(true);
    expect(matchesQuery("tirta", "Kolam Renang Melati", undefined)).toBe(false);
  });
});
