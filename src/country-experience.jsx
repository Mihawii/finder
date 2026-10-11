import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CountryFlag } from "@/components/ui/country-flag";
import { Brand } from "@/components/ui/brand";
import { onboardingSlides } from "@/lib/onboarding-slides";
import "./country-experience.css";

const OnboardingDialog = lazy(() => import("@/components/ui/onboarding-dialog").then((module) => ({ default: module.OnboardingDialog })));

gsap.registerPlugin(CustomEase, ScrollTrigger);
CustomEase.create("country-energy", "M0,0 C0.32,0.72 0,1 1,1");

// Standard maple-leaf geometry from flag-icons (MIT); attribution in public/images/credits.txt.
const MAPLE = "M135.3 247.4l-14 4.8 65.4 57.5c5 14.8-1.7 19.1-6 26.9l71-9-1.8 71.5 14.8-.5-3.3-70.9 71.2 8.4c-4.4-9.3-8.3-14.2-4.3-29l65.4-54.5-11.4-4.1c-9.4-7.3 4-34.8 6-52.2 0 0-38.1 13.1-40.6 6.2l-9.9-18.5-34.6 38c-3.8 1-5.4-.6-6.3-3.8l16-79.7-25.4 14.3q-3.3 1.3-5.6-2.4l-24.5-49-25.2 50.9q-3 2.7-5.4.8l-24.2-13.6 14.5 79.2c-1.1 3-3.9 4-7.1 2.3l-33.3-37.8c-4.3 7-7.3 18.4-13 21-5.7 2.3-25-4.9-37.9-7.7 4.4 15.9 18.2 42.3 9.5 51z";
const MAPLE_VIEWBOX = "110 95 300 315";
const FLAG_STAR = Array.from({ length: 10 }, (_, i) => {
  const angle = -Math.PI / 2 + i * Math.PI / 5;
  const radius = i % 2 ? 2.35 : 6.16;
  return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
}).join(" ");
const DESTINATIONS = {
  us: {
    name: "United States", short: "USA", greeting: "Hello,", headline: "America.",
    image: "/images/united-states.jpg", imageAlt: "The Statue of Liberty beneath an open New York sky",
    location: "Liberty Island, New York", coordinates: "40°41′ N  74°02′ W",
    cta: "U.S. assessments", intent: "I’m planning to…", promise: "Your profile. Your possibilities.",
    detail: "PathwayFinder builds a personalized immigration assessment from your profile. Canadian assessments are available now; U.S. assessments are not yet available.",
    options: [
      { id: "visit", title: "Visit & discover", subtitle: "Tourism & business" },
      { id: "study", title: "Study & grow", subtitle: "Academic & vocational study" },
      { id: "work", title: "Work & create", subtitle: "Temporary employment" },
      { id: "settle", title: "Make it home", subtitle: "Permanent immigration" },
    ],
  },
  ca: {
    name: "Canada", short: "CAN", greeting: "Bonjour,", headline: "Canada.",
    image: "/images/canada.jpg", imageAlt: "Toronto’s skyline and the CN Tower overlooking Lake Ontario",
    location: "Toronto, Ontario", coordinates: "43°39′ N  79°23′ W",
    cta: "Find my Canadian pathway", intent: "Your path to Canada", promise: "Your story. Your possibilities.",
    detail: "Your experience is more than a number. Build your profile, understand your CRS score, and explore the Canadian immigration pathways that may fit your circumstances.",
    options: [
      { id: "express", title: "Express Entry", subtitle: "Start with your CRS score", code: "01", description: "Build a profile and see how your age, education, language skills, and work experience contribute to your CRS score." },
      { id: "province", title: "Provincial pathways", subtitle: "Find a place to put down roots", code: "02", description: "Include your provincial connections and preferences in your profile to help explore potential pathways." },
      { id: "experience", title: "Canadian experience", subtitle: "Build on your time in Canada", code: "03", description: "Include your Canadian work and education in your assessment to see how they shape your profile." },
    ],
  },
};

function Arrow({ diagonal = false, ...props }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} /></svg>;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function Arrival({ country, onComplete, reduced, sceneRef }) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.delayedCall(0.05, onComplete);
        return;
      }
      const tl = gsap.timeline({ onComplete });
      const heroElements = sceneRef.current.querySelectorAll(".hero-reveal");
      const heroImage = sceneRef.current.querySelector(".country-hero-image");
      // Prepare the scene under the curtain, then reveal both in the same timeline.
      gsap.set(heroElements, { y: 22, opacity: 0 });
      if (country === "us") {
        tl.fromTo(".arrival-stripe", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.55, stagger: 0.025, ease: "country-energy" }, 0)
          .fromTo(".arrival-canton", { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.12)
          .fromTo(".arrival-star", {
          opacity: 0, scale: 0.45, y: -10,
          transformOrigin: "50% 50%",
        }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.008, ease: "power3.out" }, 0.16);
      } else {
        tl.fromTo(".arrival-leaf-outline", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, 0)
          .fromTo(".arrival-leaf-fill", { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0.4);
      }
      tl.fromTo(".arrival-caption", { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.28)
        .to(".arrival-art, .arrival-caption", { opacity: 0, y: -12, duration: 0.3 }, 1.28)
        .to(heroElements, { y: 0, opacity: 1, duration: 0.68, stagger: 0.035, ease: "country-energy" }, 1.02)
        .fromTo(heroImage, { scale: 1.025 }, { scale: 1, duration: 0.76, ease: "country-energy" }, 1.08)
        .to(root.current, { yPercent: -100, duration: 0.75, ease: "country-energy" }, 1.29);
    }, root);
    return () => ctx.revert();
  }, [country, onComplete, reduced, sceneRef]);

  return <div ref={root} className={`country-arrival arrival-${country}`} role="status" aria-live="polite">
    <div className="arrival-center">
      {country === "us" ? <svg className="arrival-art arrival-flag" viewBox="0 0 380 200" aria-hidden="true">
        {Array.from({ length: 13 }, (_, i) => <rect className="arrival-stripe" key={`stripe-${i}`} x="0" y={i * 200 / 13} width="380" height={200 / 13 + 0.05} fill={i % 2 ? "#f1eee8" : "#b33b46"} />)}
        <rect className="arrival-canton" x="0" y="0" width="152" height={7 * 200 / 13} fill="#253858" />
        {Array.from({ length: 9 }, (_, row) => Array.from({ length: row % 2 ? 5 : 6 }, (_, col) => <g key={`${row}-${col}`} transform={`translate(${(col * 2 + (row % 2 ? 2 : 1)) * 152 / 12} ${(row + 1) * (7 * 200 / 13) / 10})`}><polygon className="arrival-star" points={FLAG_STAR} fill="#f1eee8" /></g>))}
      </svg> : <svg className="arrival-art arrival-leaf" viewBox={MAPLE_VIEWBOX} aria-hidden="true"><path className="arrival-leaf-fill" d={MAPLE} fill="#d3434e"/><path className="arrival-leaf-outline" d={MAPLE} fill="none" stroke="#d3434e" strokeWidth="2" strokeLinejoin="round" pathLength="1" strokeDasharray="1" /></svg>}
      <div className="arrival-caption"><span>YOUR NEXT CHAPTER</span><p>{DESTINATIONS[country].name}</p></div>
    </div>
    <button className="arrival-skip" onClick={onComplete}>Skip introduction <Arrow /></button>
  </div>;
}

function DestinationSwitch({ country, onChange, disabled = false }) {
  return <div className="destination-switch" role="group" aria-label="Choose your destination">
    {Object.entries(DESTINATIONS).map(([id, destination]) => <button key={id} type="button" aria-pressed={country === id} onClick={() => onChange(id)} disabled={disabled}><CountryFlag country={id} /><span>{destination.name}</span></button>)}
  </div>;
}

function getInitialCountry() {
  const query = new URLSearchParams(window.location.search).get("country");
  if (query === "us" || query === "ca") return query;
  try { return localStorage.getItem("pathway-destination") === "ca" ? "ca" : "us"; } catch { return "us"; }
}

export default function CountryExperience({ onStartCanada }) {
  const [country, setCountry] = useState(getInitialCountry);
  const [arriving, setArriving] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const root = useRef(null);
  const main = useRef(null);
  const menu = useRef(null);
  const overlay = useRef(null);
  const toggle = useRef(null);
  const motion = useRef(null);
  const reduced = useReducedMotion();
  const destination = DESTINATIONS[country];
  const finishArrival = useCallback(() => setArriving(false), []);

  useEffect(() => {
    document.title = `${destination.name} · PathwayFinder`;
    try { localStorage.setItem("pathway-destination", country); } catch { /* Storage is optional. */ }
  }, [country, destination.name]);

  useEffect(() => {
    if (!arriving && !menuOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [arriving, menuOpen]);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const hero = root.current.querySelector(".country-hero");
      gsap.to(".hero-parallax-layer", {
        y: () => hero.offsetHeight * 0.18, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.45, invalidateOnRefresh: true },
      });
      gsap.to(".hero-content", {
        y: () => hero.offsetHeight * 0.055, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.45, invalidateOnRefresh: true },
      });
      gsap.fromTo(".other-destination-image", { y: -35 }, {
        y: 35, ease: "none",
        scrollTrigger: { trigger: ".other-destination", start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
      });
    }, root);
    return () => ctx.revert();
  }, [country, reduced]);

  useEffect(() => {
    if (arriving || reduced) return;
    const elements = root.current.querySelectorAll("[data-scroll-reveal]");
    const ctx = gsap.context(() => gsap.set(elements, { opacity: 0, y: 24 }), root);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ctx.add(() => gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.9, ease: "country-energy", clearProps: "transform,opacity" }));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); ctx.revert(); };
  }, [arriving, country, reduced]);

  useLayoutEffect(() => {
    motion.current?.kill();
    const links = menu.current.querySelectorAll("[data-menu-reveal]");
    const labels = toggle.current.querySelectorAll(".menu-label");
    const bars = toggle.current.querySelectorAll(".menu-bar");
    const resize = () => { gsap.set([main.current, overlay.current], { x: menuOpen ? -menu.current.offsetWidth : 0 }); };
    window.addEventListener("resize", resize);
    if (reduced) {
      gsap.set([main.current, overlay.current], { x: menuOpen ? -menu.current.offsetWidth : 0, borderRadius: menuOpen ? "20px" : "0px" });
      gsap.set(overlay.current, { visibility: menuOpen ? "visible" : "hidden", pointerEvents: menuOpen ? "auto" : "none", backgroundColor: menuOpen ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)" });
      gsap.set(links, { opacity: menuOpen ? 1 : 0, x: 0 });
      gsap.set(labels, { yPercent: menuOpen ? -100 : 0 });
      gsap.set(bars[0], { y: menuOpen ? 3.5 : 0, rotation: menuOpen ? 45 : 0 });
      gsap.set(bars[1], { y: menuOpen ? -3.5 : 0, rotation: menuOpen ? -45 : 0 });
      return () => window.removeEventListener("resize", resize);
    }
    const duration = reduced ? 0 : menuOpen ? 0.8 : 0.6;
    const tl = gsap.timeline({ defaults: { duration, ease: "country-energy", overwrite: "auto" } });
    motion.current = tl;
    if (menuOpen) {
      gsap.set(overlay.current, { visibility: "visible", pointerEvents: "auto" });
      tl.to([main.current, overlay.current], { x: () => -menu.current.offsetWidth, borderRadius: "20px" }, 0)
        .to(overlay.current, { backgroundColor: "rgba(0,0,0,0.55)" }, 0)
        .to(links, { opacity: 1, x: 0, stagger: 0.055, duration }, 0.05);
    } else {
      tl.to([main.current, overlay.current], { x: 0, borderRadius: "0px" }, 0)
        .to(overlay.current, { backgroundColor: "rgba(0,0,0,0)" }, 0)
        .to(links, { opacity: 0, x: 20, duration: reduced ? 0 : 0.2 }, 0)
        .set(overlay.current, { visibility: "hidden", pointerEvents: "none" });
    }
    tl.to(labels, { yPercent: menuOpen ? -100 : 0, duration: reduced ? 0 : 0.35 }, 0)
      .to(bars[0], { y: menuOpen ? 3.5 : 0, rotation: menuOpen ? 45 : 0, duration: reduced ? 0 : 0.35 }, 0)
      .to(bars[1], { y: menuOpen ? -3.5 : 0, rotation: menuOpen ? -45 : 0, duration: reduced ? 0 : 0.35 }, 0);
    return () => { tl.kill(); window.removeEventListener("resize", resize); };
  }, [menuOpen, reduced]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.dataset.menuStatus = "open";
    const onKey = (event) => {
      if (event.key === "Escape") { setMenuOpen(false); toggle.current.focus(); }
      if (event.key === "Tab") {
        const items = [toggle.current, ...menu.current.querySelectorAll("button, a[href]")];
        const index = items.indexOf(document.activeElement);
        event.preventDefault();
        items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { delete document.body.dataset.menuStatus; document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const changeCountry = (next) => {
    if (next === country || arriving) return;
    setMenuOpen(false);
    setOnboardingOpen(false);
    setCountry(next);
    setArriving(true);
    const url = new URL(window.location.href);
    url.searchParams.set("country", next);
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const start = () => {
    setOnboardingOpen(true);
  };
  const finishOnboarding = () => {
    setOnboardingOpen(false);
    if (country === "ca") onStartCanada();
    else changeCountry("ca");
  };
  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };

  return <div ref={root} className={`country-experience theme-${country}`}>
    <a href="#country-pathways" className="skip-link">Skip to pathways</a>
    <header className="country-header" {...(arriving ? { inert: "" } : {})}>
      <button className="brand-button" aria-label="PathwayFinder home" onClick={() => scrollTo("country-home")} {...(menuOpen ? { inert: "" } : {})}><Brand /></button>
      <div {...(menuOpen ? { inert: "" } : {})}><DestinationSwitch country={country} onChange={changeCountry} disabled={arriving} /></div>
      <button ref={toggle} className="country-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="country-menu" onClick={() => setMenuOpen(!menuOpen)}>
        <span className="menu-label-window"><span className="menu-label">Menu</span><span className="menu-label">Close</span></span><span className="menu-bars"><span className="menu-bar"/><span className="menu-bar"/></span>
      </button>
    </header>
    <nav ref={menu} id="country-menu" className="country-underlay" aria-label="Main navigation" aria-hidden={!menuOpen} {...(!menuOpen || arriving ? { inert: "" } : {})}>
      <div className="underlay-top" data-menu-reveal><span className="eyebrow">A WORLD OF POSSIBILITIES</span><CountryFlag country={country}/></div>
      <div className="underlay-links">
        {[['The beginning', 'country-home'], ['Your pathways', 'country-pathways'], ['How it works', 'country-process'], ['Questions', 'country-questions']].map(([label, id], i) => <button key={id} data-menu-reveal onClick={() => scrollTo(id)}><span>0{i + 1}</span>{label}<Arrow diagonal /></button>)}
      </div>
      <div className="underlay-bottom" data-menu-reveal><span className="eyebrow">CHOOSE YOUR NEXT CHAPTER</span><button onClick={() => changeCountry(country === "us" ? "ca" : "us")}><CountryFlag country={country === "us" ? "ca" : "us"}/>{country === "us" ? "Explore Canada" : "Explore the United States"}<Arrow/></button><p>Independent guidance.<br/>Possibilities without borders.</p></div>
    </nav>
    <div ref={overlay} className="underlay-overlay" onClick={() => { setMenuOpen(false); toggle.current.focus(); }} aria-hidden="true" />
    <main ref={main} data-main className="country-main" {...(menuOpen || arriving ? { inert: "" } : {})}>
      <section id="country-home" className="country-hero" aria-labelledby="country-title">
        <div className="hero-parallax-layer"><img className="country-hero-image" src={destination.image} alt={destination.imageAlt} fetchpriority="high" /></div>
        <div className="hero-shade"/>
        <div className="hero-side-label" aria-hidden="true">NEW PERSPECTIVES. NEW POSSIBILITIES.</div>
        <div className="hero-content">
          <h1 className="hero-reveal" id="country-title">{destination.greeting} <em>{destination.headline}</em></h1>
          <div className="hero-reveal hero-actions"><button className="country-button" onClick={() => start()}>{destination.cta}<span className="button-arrow"><Arrow /></span></button><button className="hero-secondary" onClick={() => scrollTo("country-process")}>How it works <span>↘</span></button></div>
        </div>
        <div className="hero-bottom hero-reveal"><div className="hero-location"><span className="location-cross">＋</span><div><span>{destination.location}</span><small>{destination.coordinates}</small></div></div><div className="hero-edition"><CountryFlag country={country}/><span>{destination.short}</span></div></div>
      </section>

      <section id="country-pathways" className="pathways-section section-shell">
        <div className="section-heading" data-scroll-reveal><div><span className="eyebrow">01 / FIND YOUR DIRECTION</span><h2>One destination.<br/><em>Different possibilities.</em></h2></div><p>{country === "us" ? "A visit, a degree, a career, a fresh start. Tell us what’s next for you." : "There’s more than one way forward. Discover where your experience could take you."}</p></div>
        <div className="pathway-list">
          {destination.options.map((option, index) => <button className="country-pathway" key={option.id} data-scroll-reveal onClick={() => start()}><span className="pathway-number">0{index + 1}</span><span className="pathway-title">{option.title}</span><span className="pathway-subtitle">{option.subtitle}</span><span className="pathway-arrow"><Arrow diagonal/></span></button>)}
        </div>
        <div className="pathway-footnote" data-scroll-reveal><span className="country-dot"/><span>{country === "ca" ? "Your profile. Your CRS score. A clearer starting point." : "Personalized assessments are currently available for Canada."}</span></div>
      </section>

      <section id="country-process" className="process-section section-shell">
        <div className="process-intro" data-scroll-reveal><span className="eyebrow">02 / A LITTLE DIRECTION GOES A LONG WAY</span><h2>{destination.promise.split(". ")[0]}.<br/><em>{destination.promise.split(". ")[1]}</em></h2><p>{destination.detail}</p><button className="text-link" onClick={() => start()}>Let’s find your direction <Arrow diagonal/></button></div>
        <div className="process-steps">
          {(country === "us" ? [
            ["Build your profile.", "Tell us about your education, work, language skills, and plans."],
            ["See your options.", "Get an assessment based on your background and destination."],
            ["Plan your next steps.", "Review your personalized report, pathways, and action plan."],
          ] : [
            ["Tell your story.", "A guided profile covering your education, language skills, experience, and connections."],
            ["See where you stand.", "Get your calculated CRS score and understand the factors that shape it."],
            ["Explore your next move.", "Use your assessment to explore potential pathways and prepare your next steps."],
          ]).map(([title, body], index) => <article key={title} data-scroll-reveal><span className="step-number">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}
        </div>
      </section>

      <section className="other-destination section-shell" data-scroll-reveal>
        <div className="other-destination-image"><img src={DESTINATIONS[country === "us" ? "ca" : "us"].image} alt={DESTINATIONS[country === "us" ? "ca" : "us"].imageAlt} loading="lazy"/></div>
        <div className="other-destination-content"><span className="eyebrow">ANOTHER HORIZON</span><h2>{country === "us" ? "More of a\nCanada person?" : "An American\nchapter instead?"}</h2><button className="text-link" onClick={() => changeCountry(country === "us" ? "ca" : "us")}>Explore {country === "us" ? "Canada" : "the United States"}<Arrow diagonal/></button></div>
        <CountryFlag country={country === "us" ? "ca" : "us"} className="other-destination-mark"/>
      </section>

      <section id="country-questions" className="questions-section section-shell">
        <div data-scroll-reveal><span className="eyebrow">03 / GOOD QUESTIONS</span><h2>A little more<br/><em>before you go.</em></h2></div>
        <div className="question-list" data-scroll-reveal>
          {[
            ["Is PathwayFinder a government service?", "No. PathwayFinder is an independent informational service, not affiliated with the U.S. or Canadian governments. Applications and decisions are handled by the relevant government authorities."],
            [country === "us" ? "Can I get a personalized U.S. assessment?" : "What does the Canadian assessment include?", country === "us" ? "Not yet. Personalized assessments currently cover Canada, including your profile, CRS score, and immigration pathways. U.S. assessments are not yet available." : "The guided questionnaire collects your profile and calculates your CRS score. The existing report flow can help you explore potential pathways and next steps. A score or report is not a guarantee of eligibility or approval."],
            ["Will you submit my application?", "No. We help you find direction. You remain responsible for checking current requirements and applying through the relevant official process. For advice on your circumstances, consult a qualified immigration professional."],
          ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}
        </div>
      </section>
      <footer className="country-footer section-shell"><div className="footer-top"><Brand/><span>Great journeys start with a little direction.</span><button onClick={() => scrollTo("country-home")} aria-label="Back to top">↑</button></div><div className="footer-bottom"><span>© {new Date().getFullYear()} PathwayFinder</span><span>Independent guidance. Not legal or immigration advice.</span><span>DESIGNED FOR YOUR NEXT CHAPTER ↗</span></div></footer>
    </main>
    {arriving && <Arrival key={country} country={country} reduced={reduced} sceneRef={main} onComplete={finishArrival} />}
    {onboardingOpen && <Suspense fallback={<span className="sr-only" role="status">Opening your introduction…</span>}><OnboardingDialog slides={onboardingSlides[country]} completeLabel={country === "ca" ? "Start assessment" : "Explore Canada"} onComplete={finishOnboarding} onSkip={finishOnboarding} onDismiss={() => setOnboardingOpen(false)} showRestart={false} /></Suspense>}
  </div>;
}
