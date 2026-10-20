import assert from "node:assert/strict";
import { test } from "node:test";
import { galleryHref, groupGalleryAwards, groupGalleryLevels, resolveGallerySelection, toGalleryAward } from "../src/lib/award-gallery";
import type { AwardGalleryRow } from "../src/lib/contracts/profiles";

const fixture = (id: string, year: number, competitionId: string, level: string | null): AwardGalleryRow => ({
  id, competitionYear: year, competitionId, competitionTitle: competitionId, awardLevel: level,
  userId: "student", userName: "参赛者", imageUrl: "/certificate.png", imageLargeUrl: null, createdAt: "2026-01-01",
});
test("groups real records by year and stable competition ID, without losing certificates", () => {
  const data = [fixture("1", 2025, "a", null), fixture("2", 2027, "a", "一等奖"), fixture("3", 2027, "b", "二等奖"), fixture("4", 2027, "a", "一等奖")];
  const years = groupGalleryAwards(data);
  assert.deepEqual(years.map((year) => year.year), [2027, 2025]);
  assert.equal(years[0].count, 3);
  assert.equal(years[0].competitions.length, 2);
  assert.equal(years[0].competitions[0].awards.length, 2);
  assert.equal(years.reduce((sum, year) => sum + year.count, 0), data.length);
  assert.deepEqual(groupGalleryAwards([]), []);
});
test("retains level ordering, national priority and missing level fallback", () => {
  const entries = [fixture("1", 2026, "a", "二等奖"), fixture("2", 2026, "a", null), fixture("3", 2026, "a", "省级一等奖"), fixture("4", 2026, "a", "国家级一等奖")];
  assert.deepEqual(groupGalleryLevels(entries).map(([label]) => label), ["国家级一等奖", "省级一等奖", "二等奖", "未标注等级"]);
  assert.equal(entries[0].awardLevel, "二等奖", "Input order and data stay unchanged");
});

test("client projection excludes identifiers, timestamps, large images and unexpected fields", () => {
  const source = { ...fixture("sample-certificate", 2030, "sample-event", "一等奖"),
    userId: "synthetic-private-id", imageLargeUrl: "/synthetic-original.png", email: "synthetic@example.invalid" };
  const projected = toGalleryAward(source);
  assert.deepEqual(Object.keys(projected).sort(), ["id", "userName", "competitionId", "competitionTitle", "competitionYear", "awardLevel", "imageUrl"].sort());
  assert(!JSON.stringify(projected).includes("synthetic-private-id"));
  assert(!JSON.stringify(projected).includes("synthetic@example.invalid"));
  assert.equal(projected.id, source.id);
  assert.equal(projected.imageUrl, source.imageUrl);
});

test("groups whitespace levels without mutating input and keeps same-title competitions separate", () => {
  const a = { ...fixture("a", 2030, "first", "   "), competitionTitle: "合成比赛" };
  const b = { ...fixture("b", 2030, "second", "一等奖"), competitionTitle: "合成比赛" };
  const source = Object.freeze([Object.freeze(a), Object.freeze(b)]);
  assert.equal(groupGalleryAwards([...source])[0].competitions.length, 2);
  assert.equal(groupGalleryLevels([...source]).at(-1)?.[0], "未标注等级");
  assert.equal(source[0].awardLevel, "   ");
});

test("navigation encodes identifiers and resolves only competitions within the selected year", () => {
  const years = groupGalleryAwards([fixture("a", 2030, "event/中文&x", null), fixture("b", 2029, "other", null)]);
  assert.equal(galleryHref({}), "/awards");
  assert.equal(galleryHref({ competition: "other" }), "/awards");
  const url = new URL(galleryHref({ year: 2030, competition: "event/中文&x" }), "https://example.invalid");
  assert.equal(url.searchParams.get("competition"), "event/中文&x");
  assert.equal(resolveGallerySelection(years, "2030", "event/中文&x").stage, 2);
  assert.equal(resolveGallerySelection(years, "2030", "other").stage, 1);
  assert.equal(resolveGallerySelection(years, "invalid", "other").stage, 0);
  assert.equal(resolveGallerySelection([], null, null).stage, 0);
});
