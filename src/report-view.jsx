import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Download, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/ui/brand";
import { CountryFlag } from "@/components/ui/country-flag";
import { calcCRS } from "../functions/lib/assessment/crs.js";
import { requirementState, scoreCategories } from "../functions/lib/report.js";
import "./styles/report.css";

const CHAPTERS = [
  { id: "overview", label: "Your profile", title: "A new chapter, with clarity.", description: "Your Canadian journey, shaped around you." },
  { id: "score", label: "Your score", title: "Understand your starting point.", description: "How your profile adds up in the Comprehensive Ranking System." },
  { id: "scenarios", label: "What if", title: "Explore what could change.", description: "Try a scenario. See how the points move." },
  { id: "pathways", label: "Pathways", title: "Find a direction to explore.", description: "Take a closer look at one pathway at a time." },
  { id: "plan", label: "Your plan", title: "One step closer.", description: "A suggested sequence to help you get organized." },
  { id: "budget", label: "Your budget", title: "Make room for the move.", description: "Understand the estimates and funds behind your plans." },
  { id: "next", label: "Next steps", title: "Take your next step.", description: "Keep your report, revisit your answers, or start gathering notes." },
];
const money = value => value === null || value === undefined || value === "" ? "—" : typeof value === "string" ? value : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
const asList = value => Array.isArray(value) ? value : [];

function Photo({ children, className = "", src = "/images/canada.jpg", alt = "Toronto skyline beside Lake Ontario" }) {
  return <aside className={`report-photo ${className}`}><img src={src} alt={alt} /><div className="report-photo-content">{children}</div></aside>;
}

export function ReportChoices({ label, items, value, onChange }) {
  return <nav className="report-choices" aria-label={label}>{items.map((item, index) => <Button key={item.id ?? index} variant="secondary" aria-current={value === index ? "true" : undefined} onClick={() => onChange(index)}>{item.label}</Button>)}</nav>;
}

function Detail({ title, children }) {
  return <details className="report-detail"><summary>{title}<span aria-hidden="true">+</span></summary><div>{children}</div></details>;
}

function Overview({ report, onScore }) {
  const [view, setView] = useState(0);
  const items = asList(view === 0 ? report.profile?.strengths : report.profile?.gaps);
  return <div className="report-bento report-overview">
    <article className="report-card report-profile-card">
      <span className="report-eyebrow">YOUR PROFILE</span>
      <p className="report-lead">{report.profile?.summary || "Your answers are the starting point for this report."}</p>
      <div className="report-profile-notes">
        <ReportChoices label="Profile insights" items={[{ label: "Your strengths" }, { label: "To look into" }]} value={view} onChange={setView} />
        {items.length ? <ul className="report-simple-list">{items.map((item, index) => <li key={index}><span aria-hidden="true">{view === 0 ? <Check size={14} /> : <Minus size={14} />}</span>{item}</li>)}</ul> : <p className="report-muted">No {view === 0 ? "strengths" : "gaps"} listed in this report.</p>}
      </div>
    </article>
    <Photo className="report-overview-photo"><span className="report-eyebrow">YOUR CANADIAN CHAPTER</span><h2>Possibility starts<br />with a plan.</h2><Button onClick={onScore}>Explore my score <ArrowRight size={15} /></Button></Photo>
  </div>;
}

function Score({ report, profile, breakdown }) {
  const categories = scoreCategories(profile).filter(item => item.max > 0);
  const losses = asList(report.scoreAnalysis?.losses);
  return <div className="report-bento report-score-layout">
    <article className="report-card report-score-card"><span className="report-eyebrow">YOUR CRS SCORE</span><div className="report-score-number">{breakdown.total}<span>/ 1,200</span></div><p>{report.crs?.keyInsight || "Points calculated from the factors you supplied."}</p><p className="report-fineprint">A points calculation, not a finding of eligibility or a prediction of an invitation.</p></article>
    <article className="report-card report-breakdown"><h2>Every point, explained.</h2><div className="report-bars">{categories.map(item => <div key={item.key} className="report-bar-row"><div><span>{item.label}</span><span>{breakdown[item.key] ?? 0} <small>/ {item.max}</small></span></div><div className="report-bar"><span style={{ width: `${Math.min(100, (breakdown[item.key] || 0) / item.max * 100)}%` }} /></div></div>)}</div>
      <Detail title="Where points differ from the maximum"><p className="report-muted">These are differences from category maximums, not missing eligibility requirements.</p><dl className="report-facts">{losses.map((item, index) => <div key={index}><dt>{item.category}<small>{item.explanation}</small></dt><dd>{item.currentPoints} / {item.maxPoints}</dd></div>)}</dl></Detail>
      <Detail title="How to read this score"><p>{report.crs?.competitiveness}</p><p>Work and education qualifications, language-test validity, and supporting documents still need review. This calculator does not include certificate-of-qualification points or optimize your first official language.</p></Detail>
    </article>
  </div>;
}

function Scenarios({ profile, breakdown, report, selected, setSelected }) {
  const abilities = ["reading", "writing", "listening", "speaking"];
  const atLeast = (scores, minimum) => Object.fromEntries(abilities.map(key => [key, Math.max(minimum, scores?.[key] || 0)]));
  const spouse = ["married", "common_law"].includes(profile.maritalStatus) && profile.spouseAccompanying && !profile.spouseIsCitizenPR;
  const options = [
    { id: "english", label: "Stronger English", detail: "At least CLB 9 in every ability", apply: p => { p.clb = atLeast(p.clb, 9); } },
    { id: "french", label: "French language", detail: "At least NCLC 7 in every ability", apply: p => { p.hasSecondLang = true; p.clb2 = atLeast(p.clb2, 7); } },
    ...(Number(profile.canadianWorkYears || 0) < 1 ? [{ id: "work", label: "Canadian experience", detail: "One year of qualifying skilled work", apply: p => { p.canadianWorkYears = "1"; } }] : []),
    ...(!profile.provincialNomination ? [{ id: "nomination", label: "Provincial nomination", detail: "A confirmed Express Entry nomination", apply: p => { p.provincialNomination = true; } }] : []),
    ...(spouse ? [{ id: "spouse", label: "Your partner’s language", detail: "At least CLB 9 in every ability", apply: p => { p.spouseClb = atLeast(p.spouseClb, 9); } }] : []),
  ];
  const simulated = { ...profile };
  options.filter(item => selected[item.id]).forEach(item => item.apply(simulated));
  const total = calcCRS(simulated).total;
  const gain = total - breakdown.total;
  return <div className="report-bento">
    <article className="report-card report-scenario-controls"><h2>What changes for you?</h2><p className="report-muted">Choose one or combine a few.</p><div className="report-switches">{options.map(item => <label key={item.id} className="report-switch-row"><span><strong>{item.label}</strong><small>{item.detail}</small></span><input type="checkbox" role="switch" checked={!!selected[item.id]} onChange={event => setSelected(current => ({ ...current, [item.id]: event.target.checked }))} /><span className="report-switch" aria-hidden="true" /></label>)}</div><Button variant="secondary" disabled={!Object.values(selected).some(Boolean)} onClick={() => setSelected({})}>Reset scenarios</Button></article>
    <article className="report-card report-scenario-result"><span className="report-eyebrow">CONDITIONAL CRS SCORE</span><output className="report-score-number" aria-live="polite" aria-label={`Scenario score ${total}, ${gain} point change`}>{total}<span>{gain > 0 ? `+${gain} points` : "No change yet"}</span></output><div className="report-score-comparison"><span>Your starting point</span><strong>{breakdown.total}</strong></div><p className="report-muted">All selected factors are recalculated together. Their effects can overlap.</p><p className="report-fineprint">Assumes these factors qualify for points. This is conditional arithmetic, not a forecast, eligibility decision, or spending recommendation.</p>
      <Detail title="Language scenario details">{asList(report.scoreAnalysis?.opportunities).map((item, index) => <div className="report-scenario-note" key={index}><h3>{item.action}</h3><p>{item.explanation}</p><p className="report-muted">{item.timeframe} · {item.cost}</p></div>)}</Detail>
    </article>
  </div>;
}

function Pathways({ report, selected, onSelect }) {
  const paths = [...asList(report.pathways)].sort((a, b) => a.rank - b.rank);
  const [detail, setDetail] = useState(0);
  if (!paths.length) return <article className="report-card report-empty"><span className="report-eyebrow">MORE CLARITY NEEDED</span><h2>No pathway identified yet.</h2><p>This report could not identify a pathway from the information supplied. Review your profile and any unresolved answers before seeking further guidance.</p></article>;
  const pathway = paths[Math.min(selected, paths.length - 1)];
  const details = pathway.details || {};
  return <div className="report-route-layout">
    <nav className="report-route-nav" aria-label="Choose a pathway">{paths.map((item, index) => <Button variant="secondary" key={index} aria-current={selected === index ? "true" : undefined} onClick={() => { onSelect(index); setDetail(0); }}><span className="report-route-number">0{index + 1}</span><span>{item.name}<small>{item.stream}</small></span><ArrowUpRight size={16} aria-hidden="true" /></Button>)}</nav>
    <article className="report-card report-pathway"><div className="report-pathway-heading"><span className="report-eyebrow">PATHWAY {String(selected + 1).padStart(2, "0")}</span><span className="report-muted">{requirementState(pathway)}</span></div><h2>{pathway.name}</h2><p className="report-muted">{pathway.stream}</p>
      <ReportChoices label="Pathway details" items={[{ label: "Overview" }, { label: "Requirements" }, { label: "Process" }]} value={detail} onChange={setDetail} />
      <div className="report-pathway-detail" key={detail}>
        {detail === 0 && <><p className="report-body-copy">{pathway.why}</p><dl className="report-metrics"><div><dt>Estimated time</dt><dd>{pathway.timeline || "Needs verification"}</dd></div><div><dt>Estimated cost</dt><dd>{pathway.cost || "Needs verification"}</dd></div></dl><p className="report-fineprint">Program status: {String(pathway.status || "unverified").replaceAll("_", " ")}. Verify current availability and requirements with the official program.</p></>}
        {detail === 1 && <><ul className="report-requirements">{asList(pathway.requirements).map((item, index) => <li key={index}><span className={`report-requirement-state is-${item.met === true ? "supported" : item.met === false ? "gap" : "unknown"}`}>{item.met === true ? "Supported" : item.met === false ? "Gap" : "Unknown"}</span><span>{item.item}</span></li>)}</ul><p className="report-fineprint">Based on supplied facts. “Supported” still needs verification; an unknown answer is not a failed requirement.</p></>}
        {detail === 2 && <>{details.description && <p className="report-body-copy">{details.description}</p>}<ol className="report-process">{asList(details.applicationProcess).map((item, index) => <li key={index}>{item}</li>)}</ol>{details.processingTime && <p className="report-muted">Estimated processing: {details.processingTime}</p>}{details.alternatives && <Detail title="Other considerations"><p>{details.alternatives}</p>{details.improvementTips && <p>{details.improvementTips}</p>}</Detail>}</>}
      </div>
      {/^https?:\/\//.test(details.officialLink || "") && <a className="report-text-link" href={details.officialLink} target="_blank" rel="noreferrer">Official program information <ArrowUpRight size={15} /></a>}
    </article>
  </div>;
}

function Plan({ report }) {
  const [view, setView] = useState(0);
  const [active, setActive] = useState(0);
  const items = asList(view === 0 ? report.actionPlan : report.timeline);
  const item = items[Math.min(active, items.length - 1)];
  return <><ReportChoices label="Plan view" items={[{ label: "Action plan" }, { label: "Timeline" }]} value={view} onChange={index => { setView(index); setActive(0); }} />
    {!item ? <article className="report-card report-empty"><h2>No {view === 0 ? "actions" : "timeline"} listed yet.</h2><p>Your report needs more information before a plan can be outlined.</p></article> : <div className="report-bento report-plan-layout"><article className="report-card report-action-card"><span className="report-eyebrow">{view === 0 ? `STEP ${String(active + 1).padStart(2, "0")} OF ${String(items.length).padStart(2, "0")}` : item.month}</span><h2>{view === 0 ? item.action : item.label}</h2>{view === 1 && <p className="report-body-copy">{item.tasks}</p>}{view === 0 && <dl className="report-metrics"><div><dt>Where</dt><dd>{item.where || "Verify with the program"}</dd></div><div><dt>Estimated time</dt><dd>{item.time || "Not specified"}</dd></div><div><dt>Estimated cost</dt><dd>{item.cost || "Not specified"}</dd></div><div><dt>Priority</dt><dd>{item.priority || "Not specified"}</dd></div></dl>}<div className="report-item-navigation"><Button variant="secondary" disabled={active === 0} onClick={() => setActive(active - 1)} aria-label="Previous plan item"><ArrowLeft size={16} /></Button><span>{active + 1} / {items.length}</span><Button variant="secondary" disabled={active === items.length - 1} onClick={() => setActive(active + 1)} aria-label="Next plan item"><ArrowRight size={16} /></Button></div><p className="report-fineprint">Suggested sequence only. Timelines and availability can change; verify before acting.</p></article><Photo src="/images/onboarding-mountain.jpg" alt="Sunlit mountain summit"><span className="report-eyebrow">A LITTLE PROGRESS, EVERY DAY</span><h2>Your own pace.<br />Your own path.</h2></Photo></div>}
  </>;
}

export function ReportBudget({ report }) {
  const [view, setView] = useState(0);
  const costs = asList(report.costs?.items);
  const maximum = Math.max(0, ...costs.map(item => Number(item.amount) || 0));
  const funds = report.assessment?.funds;
  const total = report.costs?.total ?? costs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return <><ReportChoices label="Budget view" items={[{ label: "Estimated costs" }, { label: "Settlement funds" }]} value={view} onChange={setView} />
    {view === 0 ? <div className="report-bento"><article className="report-card report-budget-total"><span className="report-eyebrow">ESTIMATED COSTS · CAD</span><h2>{money(total)}</h2><p className="report-muted">The report’s overall estimate. Costs depend on your route and family circumstances.</p><p className="report-fineprint">Individual items can represent alternative routes and may not add up to this estimate. Verify current fees before paying.</p></article><article className="report-card"><h2>What goes into it.</h2>{costs.length ? <div className="report-bars">{costs.map((item, index) => <div className="report-bar-row" key={index}><div><span>{item.name}</span><span>{money(item.amount)}</span></div><div className="report-bar"><span style={{ width: `${maximum ? Math.max(0, Number(item.amount) || 0) / maximum * 100 : 0}%` }} /></div></div>)}</div> : <p className="report-muted">No individual fees verified in this report.</p>}</article></div>
      : funds ? <div className="report-bento"><article className="report-card report-budget-total"><span className="report-eyebrow">EXPRESS ENTRY · FSW / FST</span><h2>{money(funds.available)}</h2><p className="report-muted">Your stated settlement funds</p><p className="report-body-copy">{({ sufficient: "Your stated amount meets this published minimum.", insufficient: "Your stated amount is below this published minimum.", exempt: "A potential exemption applies to the valid offer and work authorization you reported.", unknown: "More information is needed to compare your funds." })[funds.status]}</p></article><article className="report-card"><h2>The comparison.</h2><dl className="report-facts"><div><dt>Family members counted</dt><dd>{funds.familySize ?? "Needs clarification"}</dd></div><div><dt>Published minimum</dt><dd>{money(funds.required)}</dd></div><div><dt>Stated funds</dt><dd>{money(funds.available)}</dd></div></dl><p className="report-fineprint">Includes non-accompanying family. Access to funds and supporting evidence still need verification. CEC and other routes have different rules.</p><a className="report-text-link" href={funds.sourceUrl} target="_blank" rel="noreferrer">IRCC funds guidance <ArrowUpRight size={15} /></a><p className="report-fineprint">Source checked {funds.verifiedAt}.</p></article></div> : <article className="report-card report-empty"><h2>More information needed.</h2><p>A settlement funds comparison is unavailable in this report.</p></article>}
  </>;
}

function NextSteps({ report, onPrepare, onBack, onRestart, onDownload, downloading, onShare, status }) {
  const [view, setView] = useState(0);
  return <><ReportChoices label="Next step" items={[{ label: "Keep your report" }, { label: "Prepare a worksheet" }, { label: "Sources & limits" }]} value={view} onChange={setView} />
    <div className="report-bento"><article className="report-card report-next-card">
      {view === 0 && <><span className="report-eyebrow">YOURS TO COME BACK TO</span><h2>Keep the bigger picture.</h2><p className="report-body-copy">Download your informational report to review it at your own pace.</p><div className="report-next-actions"><Button onClick={onDownload} disabled={downloading}><Download size={15} />{downloading ? "Preparing PDF…" : "Download report"}</Button><Button variant="secondary" onClick={onShare}>Copy summary</Button></div><div className="report-next-secondary"><Button variant="secondary" onClick={onBack}>Edit my profile <ArrowUpRight size={14} /></Button><Button variant="secondary" onClick={onRestart}>Start a new assessment <ArrowUpRight size={14} /></Button></div></>}
      {view === 1 && <><span className="report-eyebrow">PARTIAL PREPARATION WORKSHEET</span><h2>Bring your notes together.</h2><p className="report-body-copy">For adult, non-business provincial nominees using Canada’s non-Express Entry process.</p><p className="report-muted">Organize applicant details, family notes, history and document reminders. Your route is checked before you begin.</p><p className="report-fineprint">Drafts stay in this tab only; refreshing clears them. No uploads, official forms, application submission or eligibility decision.</p><Button onClick={onPrepare}>Check my route <ArrowRight size={15} /></Button></>}
      {view === 2 && <><span className="report-eyebrow">READ WITH CONTEXT</span><h2>A starting point for your research.</h2><p className="report-body-copy">Program data as of {report.assessment?.dataAsOf || "an unverified date"}. {report.assessment?.dataStale ? "This snapshot is dated and requires current verification." : "Program information still needs verification."}</p><ul className="report-simple-list">{asList(report.assessment?.limitations).map((item, index) => <li key={index}>{item}</li>)}</ul><p className="report-muted">{report.dataDisclaimer || "Independent information, not immigration or legal advice. Verify current requirements with official sources or a licensed professional."}</p></>}
      {status && <p className="report-status" role="status">{status}</p>}
    </article><Photo src="/images/onboarding-horizon.jpg" alt="A quiet landscape at the horizon"><span className="report-eyebrow">THE ROAD AHEAD</span><h2>Make the next<br />chapter yours.</h2></Photo></div>
  </>;
}

export default function ReportView({ report, profile, breakdown, onBack, onRestart, onPrepare }) {
  const [chapter, setChapter] = useState(0);
  const [pathway, setPathway] = useState(0);
  const [scenarios, setScenarios] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState("");
  const heading = useRef(null);
  const chapterNav = useRef(null);
  const navigated = useRef(false);
  const current = CHAPTERS[chapter];
  useEffect(() => {
    if (navigated.current) { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); chapterNav.current?.querySelector("[aria-current]")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }); }
  }, [chapter]);
  const goTo = index => { navigated.current = true; setChapter(index); setStatus(""); };
  const download = async () => {
    if (downloading) return;
    setDownloading(true); setStatus("");
    try {
      const response = await fetch(import.meta.env.VITE_GENERATE_PDF_URL || "https://us-central1-pathwayfinder-3b040.cloudfunctions.net/generatePdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ report, breakdown }) });
      if (!response.ok) throw new Error("PDF unavailable");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = "PathwayFinder-Report.pdf"; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Your informational report was downloaded.");
    } catch { setStatus("The PDF couldn’t be downloaded. Your report is still here; please try again."); }
    finally { setDownloading(false); }
  };
  const share = async () => {
    const topPathway = report.pathways?.[0];
    try { await navigator.clipboard.writeText(["PathwayFinder report", `CRS score: ${breakdown.total}`, topPathway && `Pathway to review: ${topPathway.name}`, topPathway && `Requirements: ${requirementState(topPathway)}`, report.crs?.keyInsight, `Program data as of ${report.assessment?.dataAsOf || "an unverified date"}.`, "Informational only. Eligibility and current requirements need verification."].filter(Boolean).join("\n")); setStatus("Summary copied."); }
    catch { setStatus("The summary couldn’t be copied. You can download the report instead."); }
  };
  return <div className="report-shell">
    <header className="report-header"><a className="report-brand" href="/?country=ca" onClick={event => { event.preventDefault(); onBack?.(); }}><Brand /></a><span className="report-destination"><CountryFlag country="ca" /> Canada <span>/ Your report</span></span><Button variant="secondary" onClick={onBack}><ArrowLeft size={14} /> Edit profile</Button></header>
    <div className="report-workspace"><nav ref={chapterNav} className="report-chapters" aria-label="Report chapters">{CHAPTERS.map((item, index) => <Button variant="secondary" key={item.id} aria-current={chapter === index ? "step" : undefined} onClick={() => goTo(index)}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</Button>)}</nav>
      <main className="report-main"><div className="report-title"><div><p className="report-eyebrow">YOUR PATHWAY REPORT <span>/ {String(chapter + 1).padStart(2, "0")}</span></p><h1 ref={heading} tabIndex={-1}>{current.title}</h1><p>{current.description}</p></div><span className="report-chapter-count">{String(chapter + 1).padStart(2, "0")}<span> / 07</span></span></div>
        <section key={current.id} className="report-stage" aria-label={current.label}>
          {chapter === 0 && <Overview report={report} onScore={() => goTo(1)} />}
          {chapter === 1 && <Score report={report} profile={profile} breakdown={breakdown} />}
          {chapter === 2 && <Scenarios profile={profile} breakdown={breakdown} report={report} selected={scenarios} setSelected={setScenarios} />}
          {chapter === 3 && <Pathways report={report} selected={pathway} onSelect={setPathway} />}
          {chapter === 4 && <Plan report={report} />}
          {chapter === 5 && <ReportBudget report={report} />}
          {chapter === 6 && <NextSteps report={report} onPrepare={onPrepare} onBack={onBack} onRestart={onRestart} onDownload={download} downloading={downloading} onShare={share} status={status} />}
        </section>
        <footer className="report-footer"><Button variant="secondary" onClick={() => chapter === 0 ? onBack?.() : goTo(chapter - 1)}><ArrowLeft size={15} />{chapter === 0 ? "Back to profile" : CHAPTERS[chapter - 1].label}</Button><p>Program data: {report.assessment?.dataAsOf || "unverified"}<span> · Independent guidance. Not an eligibility decision.</span></p>{chapter < CHAPTERS.length - 1 ? <Button onClick={() => goTo(chapter + 1)}>{CHAPTERS[chapter + 1].label}<ArrowRight size={15} /></Button> : <Button variant="secondary" onClick={() => goTo(0)}>Back to overview <ArrowRight size={15} /></Button>}</footer>
      </main>
    </div>
  </div>;
}
