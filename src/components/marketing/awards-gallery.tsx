"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LazyFillImage } from "@/components/shared/lazy-fill-image";
import type { GalleryAward } from "@/lib/award-gallery";
import { galleryHref, groupGalleryAwards, groupGalleryLevels, resolveGallerySelection } from "@/lib/award-gallery";

function Count({ value, unit }: { value: number; unit: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const completedValue = useRef<number | null>(null);
  const [counter, setCounter] = useState({ target: value, display: value });
  const display = reducedMotion || counter.target !== value ? value : counter.display;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!window.IntersectionObserver || reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const finish = requestAnimationFrame(() => {
        completedValue.current = value;
        setCounter({ target: value, display: value });
      });
      return () => cancelAnimationFrame(finish);
    }
    if (completedValue.current === value) return;
    let frame = 0;
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || started) return;
      started = true;
      observer.disconnect();
      setCounter({ target: value, display: 0 });
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 3000, 1);
        setCounter({ target: value, display: Math.floor(value * (1 - (1 - progress) ** 2)) });
        if (progress < 1) frame = requestAnimationFrame(tick);
        else completedValue.current = value;
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, reducedMotion]);
  return <span ref={ref} role="img" className="inline-flex items-baseline gap-1 whitespace-nowrap" aria-label={`${value}${unit}`}><strong aria-hidden="true" className="text-4xl font-semibold tabular-nums text-blue-700">{display.toLocaleString("zh-CN")}</strong><span aria-hidden="true" className="text-sm text-slate-500">{unit}</span></span>;
}

function CompetitionCard({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  return <motion.article className="flex min-w-0 flex-col gap-5 rounded-xl border-2 border-blue-600 bg-white p-5"
    animate={reducedMotion ? { x: 0, y: 0 } : offset} transition={{ type: "spring", stiffness: 220, damping: 26 }}
    onPointerMove={(event) => {
      if (event.pointerType !== "mouse" || reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const box = event.currentTarget.getBoundingClientRect();
      setOffset({ x: Math.max(-6, Math.min(6, (event.clientX - box.left - box.width / 2) / 30)), y: Math.max(-6, Math.min(6, (event.clientY - box.top - box.height / 2) / 30)) });
    }} onPointerLeave={() => setOffset({ x: 0, y: 0 })} onFocusCapture={() => setOffset({ x: 0, y: 0 })}>{children}</motion.article>;
}

export function AwardsGallery({ awards }: { awards: GalleryAward[] }) {
  const years = useMemo(() => groupGalleryAwards(awards), [awards]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedYear = searchParams.get("year");
  const selectedCompetition = searchParams.get("competition");
  const heading = useRef<HTMLHeadingElement>(null);
  const guide = useRef<HTMLElement>(null);
  const shouldFocus = useRef(false);
  const { year, competition, stage } = resolveGallerySelection(years, selectedYear, selectedCompetition);
  const latest = years[0];
  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    heading.current?.focus({ preventScroll: true });
    guide.current?.scrollIntoView({ block: "start" });
  }, [selectedYear, selectedCompetition]);
  function navigate(next: { year?: number; competition?: string }) {
    shouldFocus.current = true;
    router.push(galleryHref(next), { scroll: false });
  }
  const title = competition?.title ?? (year ? `${year.year}年获奖比赛` : "荣誉展示");
  const action = "inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600";
  return <main className="mx-auto max-w-6xl px-4 pb-14 pt-8 md:px-6">
    <nav ref={guide} aria-label="荣誉展示页面层级" className="mb-5 scroll-mt-5"><ol className="grid grid-cols-3 gap-3 sm:flex sm:gap-6">
      {["年度总览", "年度比赛", "获奖证书"].map((label, index) => {
        const current = index === stage;
        const detail = current ? `当前所在${index === 1 ? ` · ${year?.year}年` : ""}` : index < stage ? (index === 1 ? `返回${year?.year}年比赛` : "返回年度总览") : "";
        const content = <><strong className="whitespace-nowrap text-sm">{label}</strong>{detail && <small className="text-xs leading-relaxed">{detail}</small>}</>;
        const classes = `flex min-h-14 w-full flex-col items-start justify-center gap-0.5 rounded-md px-1.5 py-2 text-left sm:px-3 ${current ? "bg-blue-50 font-semibold text-blue-800" : index < stage ? "text-slate-700 hover:bg-slate-50" : "text-slate-500"}`;
        return <li key={label} className="relative min-w-0 after:absolute after:-right-2.5 after:top-4 after:text-slate-400 after:content-['›'] last:after:content-none sm:after:-right-4">{index < stage ? <button type="button" className={classes} onClick={() => navigate(index === 0 ? {} : { year: year?.year })}>{content}</button> : <span aria-current={current ? "page" : undefined} className={classes}>{content}</span>}</li>;
      })}
    </ol></nav>
    <div className="mb-8 flex flex-wrap items-start justify-between gap-6"><div className="min-w-0"><h1 ref={heading} tabIndex={-1} className="text-2xl font-bold leading-relaxed break-words focus-visible:outline-2 focus-visible:outline-blue-600 sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-slate-500">{competition ? "点击证书查看大图与获奖信息。" : year ? `已公开${year.competitions.length}项比赛、${year.count}份获奖证书。` : "按年份和比赛查看已公开的获奖证书。"}</p></div>
      {latest && <aside hidden={stage !== 0} aria-label={`${latest.year}年成果速览`} className="max-w-full rounded-xl border border-slate-200 p-5"><p className="mb-4 text-sm">{latest.year}年成果速览</p><div className="flex flex-wrap gap-8"><div><Count value={latest.count} unit="份" /><p className="mt-2 text-sm text-slate-500">获奖证书</p></div><div><Count value={latest.competitions.length} unit="项" /><p className="mt-2 text-sm text-slate-500">获奖比赛</p></div></div></aside>}
    </div>
    {years.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">暂无已通过审核的获奖证书。</p>}
    {stage === 0 && <div className="space-y-5">{years.map((item) => <section key={item.year} className="rounded-xl border-2 border-blue-100 p-5 sm:p-7"><div className="mb-6 flex flex-wrap items-center gap-4"><h2 className="text-2xl font-semibold text-blue-700">{item.year}年</h2><p className="text-sm text-slate-500">已公开{item.competitions.length}项比赛、{item.count}份获奖证书。</p><button type="button" className={`${action} sm:ml-auto`} onClick={() => navigate({ year: item.year })}>查看年度比赛</button></div><div className="grid gap-4 min-[360px]:grid-cols-2 lg:grid-cols-3">{item.competitions.map((entry) => <CompetitionCard key={entry.id}><h3 className="text-sm font-semibold leading-7 break-words">{entry.title}</h3><p className="mt-auto whitespace-nowrap text-blue-700"><strong className="text-2xl tabular-nums">{entry.awards.length}</strong><span className="ml-1 text-sm text-slate-500">份证书</span></p></CompetitionCard>)}</div></section>)}</div>}
    {stage === 1 && year && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{year.competitions.map((entry) => <CompetitionCard key={entry.id}><h2 className="text-base font-semibold leading-7 break-words">{entry.title}</h2><div className="mt-auto flex flex-wrap items-center justify-between gap-3"><span className="whitespace-nowrap text-sm text-slate-500">{entry.awards.length}份证书</span><button type="button" className={action} onClick={() => navigate({ year: year.year, competition: entry.id })}>查看获奖证书</button></div></CompetitionCard>)}</div>}
    {stage === 2 && competition && <div className="space-y-8">{groupGalleryLevels(competition.awards).map(([level, entries]) => <section key={level}><h2 className="mb-4 text-base font-semibold">{level}<span className="ml-3 whitespace-nowrap text-sm font-normal text-slate-500">{entries.length}份</span></h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{entries.map((award) => <Link key={award.id} href={`/awards/${encodeURIComponent(award.id)}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"><div className="relative aspect-[4/3]"><LazyFillImage src={award.imageUrl} alt={`${award.competitionTitle} ${level} ${award.userName}获奖证书`} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-contain" fallbackText="奖状图片暂不可用" fallbackClassName="px-4 text-center" /></div><div className="p-3"><p className="text-sm leading-relaxed">{award.competitionTitle}</p><p className="mt-1 text-xs text-slate-500">{award.userName}</p></div></Link>)}</div></section>)}</div>}
  </main>;
}
