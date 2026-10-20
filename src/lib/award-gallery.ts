import type { AwardGalleryRow } from "./contracts/profiles";

interface GalleryCompetition {
  id: string;
  title: string;
  awards: AwardGalleryRow[];
}

export function groupGalleryAwards(awards: AwardGalleryRow[]) {
  const years = new Map<number, Map<string, GalleryCompetition>>();
  for (const award of awards) {
    const competitions = years.get(award.competitionYear) ?? new Map<string, GalleryCompetition>();
    const competition: GalleryCompetition = competitions.get(award.competitionId) ?? { id: award.competitionId, title: award.competitionTitle, awards: [] };
    competition.awards.push(award);
    competitions.set(award.competitionId, competition);
    years.set(award.competitionYear, competitions);
  }
  return [...years].sort(([a], [b]) => b - a).map(([year, competitions]) => ({
    year, count: [...competitions.values()].reduce((sum, competition) => sum + competition.awards.length, 0),
    competitions: [...competitions.values()].sort((a, b) => a.title.localeCompare(b.title, "zh-CN")),
  }));
}

const ranks = ["特等", "一等", "二等", "三等", "优秀", "参与"];
const categories = ["国家级", "省级", "市级", "校级", "院级"];
function rank(label: string, keywords: string[]) {
  const index = keywords.findIndex((keyword) => label.includes(keyword));
  return index < 0 ? 10 : index;
}
export function groupGalleryLevels(awards: AwardGalleryRow[]) {
  const levels = new Map<string, AwardGalleryRow[]>();
  for (const award of awards) {
    const level = award.awardLevel?.trim() || "未标注等级";
    levels.set(level, [...(levels.get(level) ?? []), award]);
  }
  return [...levels].sort(([a], [b]) => rank(a, ranks) - rank(b, ranks) || rank(a, categories) - rank(b, categories) || a.localeCompare(b, "zh-CN"));
}
