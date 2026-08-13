import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSavedListCsv } from "./parseSavedListCsv";
import { fixturePath } from "../testSupport/fixtures";

function fixtureContent(name: string): string {
  return readFileSync(fixturePath("places", name), "utf-8");
}

describe("parseSavedListCsv", () => {
  it("parses CSV content returning all non-header rows", () => {
    const result = parseSavedListCsv(fixtureContent("Coffee.csv"), "Coffee");

    expect(result).toEqual([
      {
        listName: "Coffee",
        title: "Opus Coffee - Airstream",
        note: "",
        url: "https://www.google.com/maps/place/Opus+Coffee+-+Airstream/data=!4m2!3m1!1s0x88e8a38df8a98f49:0xf5d2d43627f569df",
        tags: "",
        comment: "",
      },
      {
        listName: "Coffee",
        title: "Coffee Culture",
        note: "",
        url: "https://www.google.com/maps/place/Coffee+Culture/data=!4m2!3m1!1s0x88e8a464ab6560f3:0x312480150a545afb",
        tags: "",
        comment: "",
      },
    ]);
  });

  it("can parse an empty file", () => {
    const result = parseSavedListCsv(fixtureContent("Empty.csv"), "Empty");

    expect(result).toEqual([]);
  });

  it("can parse a 0-places file", () => {
    const result = parseSavedListCsv(fixtureContent("Zero.csv"), "Zero");

    expect(result).toEqual([]);
  });
});
