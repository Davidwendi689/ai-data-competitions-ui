import type { AwardGalleryRow } from "./contracts/profiles";

/** Only fields required by the public gallery may cross the client boundary. */
export type GalleryAward = Pick<AwardGalleryRow,
  "id" | "userName" | "competitionId" | "competitionTitle" |
  "competitionYear" | "awardLevel" | "imageUrl"
>;

export function toGalleryAward(award: AwardGalleryRow): GalleryAward {
  return {
    id: award.id,
    userName: award.userName,
    competitionId: award.competitionId,
    competitionTitle: award.competitionTitle,
    competitionYear: award.competitionYear,
    awardLevel: award.awardLevel,
    imageUrl: award.imageUrl,
  };
}

interface GalleryCompetition {
  id: string;
  title: string;
  awards: GalleryAward[];
}

export function groupGalleryAwards(awards: GalleryAward[]) {
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
export function groupGalleryLevels(awards: GalleryAward[]) {
  const levels = new Map<string, GalleryAward[]>();
  for (const award of awards) {
    const level = award.awardLevel?.trim() || "未标注等级";
    const entries = levels.get(level) ?? [];
    entries.push(award);
    levels.set(level, entries);
  }
  return [...levels].sort(([a], [b]) => rank(a, ranks) - rank(b, ranks) || rank(a, categories) - rank(b, categories) || a.localeCompare(b, "zh-CN"));
}

export function galleryHref(selection: { year?: number; competition?: string }) {
  const query = new URLSearchParams();
  if (selection.year !== undefined) query.set("year", String(selection.year));
  if (selection.year !== undefined && selection.competition) query.set("competition", selection.competition);
  return query.size ? `/awards?${query}` : "/awards";
}

export function resolveGallerySelection(
  years: ReturnType<typeof groupGalleryAwards>,
  selectedYear: string | null,
  selectedCompetition: string | null,
) {
  const year = years.find((item) => String(item.year) === selectedYear);
  const competition = year?.competitions.find((item) => item.id === selectedCompetition);
  return { year, competition, stage: competition ? 2 : year ? 1 : 0 };
}
