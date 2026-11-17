import { describe, expect, it } from "vitest";
import {
  featuredSections,
  findBrandInTitle,
  reelsInCategory,
  formatReelDuration,
  isShowcasePathForReel,
  moveWrites,
  nextSortOrder,
  slugifyCategoryName,
  uniqueSlug,
} from "./utils";

describe("slugifyCategoryName", () => {
  it("makes a link name", () => {
    expect(slugifyCategoryName("Food & beverage")).toBe("food-beverage");
    expect(slugifyCategoryName("  Café  Culture ")).toBe("cafe-culture");
    expect(slugifyCategoryName("&&&")).toBe("category");
  });
});

describe("uniqueSlug", () => {
  it("adds the first free number", () => {
    expect(uniqueSlug("food", new Set())).toBe("food");
    expect(uniqueSlug("food", new Set(["food", "food-2"]))).toBe("food-3");
  });
});

describe("findBrandInTitle", () => {
  const clients = ["MTR", "Prakriti Sattva", "Chupps", "AB"];
  it("finds a client name as a whole word, any case", () => {
    expect(findBrandInTitle("MTR Badam Mix Reel 1", clients)).toBe("MTR");
    expect(findBrandInTitle("know your prakriti sattva", clients)).toBe("Prakriti Sattva");
    expect(findBrandInTitle("chupps: style or comfort", clients)).toBe("Chupps");
  });
  it("ignores names inside other words and very short names", () => {
    expect(findBrandInTitle("Metric breakfast", clients)).toBeNull();
    expect(findBrandInTitle("A fabulous morning", clients)).toBeNull();
  });
});

describe("moveWrites", () => {
  const items = [
    { id: "a", sortOrder: 10 },
    { id: "b", sortOrder: 20 },
    { id: "c", sortOrder: 30 },
  ];
  it("swaps with the neighbour and writes only what changed", () => {
    expect(moveWrites(items, "b", -1)).toEqual([
      { id: "b", sortOrder: 10 },
      { id: "a", sortOrder: 20 },
    ]);
  });
  it("does nothing at either end", () => {
    expect(moveWrites(items, "a", -1)).toEqual([]);
    expect(moveWrites(items, "c", 1)).toEqual([]);
  });
  it("untangles equal orders", () => {
    const tied = [
      { id: "a", sortOrder: 10 },
      { id: "b", sortOrder: 10 },
    ];
    expect(moveWrites(tied, "b", -1)).toEqual([{ id: "a", sortOrder: 20 }]);
  });
});

describe("nextSortOrder", () => {
  it("goes after the last", () => {
    expect(nextSortOrder([])).toBe(10);
    expect(nextSortOrder([{ sortOrder: 40 }, { sortOrder: 20 }])).toBe(50);
  });
});

describe("formatReelDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatReelDuration(22_151)).toBe("0:22");
    expect(formatReelDuration(65_000)).toBe("1:05");
  });
});

describe("isShowcasePathForReel", () => {
  it("accepts only files under the reel's folder", () => {
    expect(isShowcasePathForReel("showcase/r1/video__x.mp4", "r1")).toBe(true);
    expect(isShowcasePathForReel("showcase/r2/video__x.mp4", "r1")).toBe(false);
    expect(isShowcasePathForReel("showcase/r1/../r2/v.mp4", "r1")).toBe(false);
    expect(isShowcasePathForReel("clients/x/showcase/r1/v.mp4", "r1")).toBe(false);
  });
});

describe("reelsInCategory / featuredSections", () => {
  const cats = [{ id: "food" }, { id: "founder" }, { id: "pets" }];
  const reels = [
    { id: "r1", placements: [{ categoryId: "founder", sortOrder: 10 }, { categoryId: "food", sortOrder: 20 }] },
    { id: "r2", placements: [{ categoryId: "food", sortOrder: 10 }] },
    { id: "r3", placements: [{ categoryId: "founder", sortOrder: 5 }] },
  ];
  it("lists a category's reels in that category's order", () => {
    expect(reelsInCategory(reels, "food").map((r) => r.id)).toEqual(["r2", "r1"]);
    expect(reelsInCategory(reels, "founder").map((r) => r.id)).toEqual(["r3", "r1"]);
    expect(reelsInCategory(reels, "pets")).toEqual([]);
  });
  it("shows each reel once, under its first category in page order", () => {
    const sections = featuredSections(cats, reels);
    expect(sections.map((s) => [s.category.id, s.reels.map((r) => r.id)])).toEqual([
      ["food", ["r2", "r1"]],
      ["founder", ["r3"]],
    ]);
  });
});
