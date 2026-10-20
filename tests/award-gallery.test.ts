import assert from "node:assert/strict";
import { test } from "node:test";
import { groupGalleryAwards, groupGalleryLevels } from "../src/lib/award-gallery";
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
