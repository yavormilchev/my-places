import { describe, expect, it } from "vitest";
import { filterByCategory } from "./filterByCategory";

const PARK = { category: "Parks", title: "Some Park" };
const COFFEE = { category: "Coffee", title: "Some Cafe" };
const CLUB = { category: "Club", title: "Some Club" };

describe("filterByCategory", () => {
  it("returns everything when no categories are given", () => {
    expect(filterByCategory([PARK, COFFEE, CLUB], [])).toEqual([
      PARK,
      COFFEE,
      CLUB,
    ]);
  });

  it("matches any of several categories, not just one", () => {
    expect(filterByCategory([PARK, COFFEE, CLUB], ["Parks", "Coffee"])).toEqual(
      [PARK, COFFEE],
    );
  });

  it("excludes places whose category isn't in the list", () => {
    expect(filterByCategory([PARK, COFFEE, CLUB], ["Parks"])).toEqual([PARK]);
  });

  it("returns nothing when no place matches any requested category", () => {
    expect(filterByCategory([PARK, COFFEE], ["Museums"])).toEqual([]);
  });
});
