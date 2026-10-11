import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { onboardingSlides, type OnboardingSlide } from "@/lib/onboarding-slides"

export type OnboardingDialogProps = {
  defaultOpen?: boolean
  slides?: readonly OnboardingSlide[]
  label?: string
  onComplete?: () => void
  onSkip?: () => void
  onDismiss?: () => void
  showRestart?: boolean
}

export function OnboardingDialog({
  defaultOpen = true,
  slides = onboardingSlides.ca,
  label = "YOUR NEXT CHAPTER",
  onComplete,
  onSkip,
  onDismiss,
  showRestart = true,
}: OnboardingDialogProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()
  const reducedMotion = useReducedMotion()
  const currentSlide = slides[activeIndex] ?? slides[0]
  const duration = reducedMotion ? 0 : 0.24

  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on("select", onSelect).on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect)
    }
  }, [emblaApi])

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !document.querySelector("dialog[open]")) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [open])

  // A newly opened native dialog has no layout until showModal() runs.
  React.useEffect(() => {
    if (open && emblaApi) {
      emblaApi.reInit()
      emblaApi.scrollTo(0, true)
    }
  }, [open, emblaApi])

  const close = (action?: () => void) => {
    dialogRef.current?.close()
    setOpen(false)
    action?.()
  }

  const handleNext = () => {
    if (activeIndex === slides.length - 1) close(onComplete)
    else emblaApi?.scrollNext(Boolean(reducedMotion))
  }

  if (!currentSlide) return null

  if (!open) {
    return showRestart ? (
      <button
        type="button"
        onClick={() => { setActiveIndex(0); setOpen(true) }}
        className="rounded-md border-0 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Restart Onboarding
      </button>
    ) : null
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="onboarding-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      onCancel={(event) => { event.preventDefault(); close(onDismiss) }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"))
          const first = buttons[0]
          const last = buttons[buttons.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
        if (event.key === "ArrowRight") { event.preventDefault(); emblaApi?.scrollNext(Boolean(reducedMotion)) }
        if (event.key === "ArrowLeft") { event.preventDefault(); emblaApi?.scrollPrev(Boolean(reducedMotion)) }
      }}
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration }}
        className="p-3 sm:p-4"
      >
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <span className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-muted-foreground">
            <Compass size={15} aria-hidden="true" />{label}
          </span>
          <button type="button" autoFocus onClick={() => close(onDismiss)} aria-label="Close onboarding" className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div ref={emblaRef} className="overflow-hidden rounded-xl" role="region" aria-roledescription="carousel" aria-label="Getting started with PathwayFinder">
          <div className="flex touch-pan-y">
            {slides.map((slide, index) => (
              <div key={slide.id} className="min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} aria-hidden={index !== activeIndex}>
                <div className="p-1">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    draggable={false}
                    width={1200}
                    height={675}
                    className="aspect-video h-auto w-full rounded-lg bg-muted object-cover"
                    onError={(event) => {
                      // The bundled Unsplash photograph also works without a network connection.
                      if (event.currentTarget.dataset.fallback) return
                      event.currentTarget.dataset.fallback = "true"
                      event.currentTarget.src = "/images/canada.jpg"
                      event.currentTarget.alt = "Toronto skyline beside Lake Ontario"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1" role="group" aria-label="Onboarding slides">
          {slides.map((slide, index) => (
            <motion.div key={slide.id} animate={{ width: index === activeIndex ? 32 : 24 }} initial={false} transition={{ duration }}>
              <button
                type="button"
                onClick={() => emblaApi?.scrollTo(index, Boolean(reducedMotion))}
                aria-label={`Go to ${slide.title}`}
                aria-current={index === activeIndex ? "step" : undefined}
                className="flex h-8 w-full items-center justify-center rounded-full p-1"
              >
                <span className={cn("block h-1.5 w-full rounded-full transition-colors", index === activeIndex ? "bg-foreground" : "bg-border hover:bg-muted-foreground")} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 grid px-2 sm:px-3">
          {slides.map((slide) => (
            <motion.div
              key={slide.id}
              animate={{ opacity: currentSlide.id === slide.id ? 1 : 0 }}
              initial={false}
              aria-hidden={currentSlide.id !== slide.id}
              className="col-start-1 row-start-1"
              style={{ pointerEvents: currentSlide.id === slide.id ? "auto" : "none" }}
              transition={{ duration }}
            >
              <h2 id={currentSlide.id === slide.id ? titleId : undefined} className="onboarding-heading text-[32px] leading-[1.12] font-normal tracking-tight sm:text-[36px]">{slide.title}</h2>
              <p id={currentSlide.id === slide.id ? descriptionId : undefined} className="mt-3 text-sm leading-relaxed text-muted-foreground">{slide.description}</p>
            </motion.div>
          ))}
        </div>
        <span className="sr-only" aria-live="polite" aria-atomic="true">{currentSlide.title}</span>

        <div className="mt-7 flex items-center justify-between gap-2 border-t border-border px-1 pt-4 pb-1 sm:px-3">
          <div>
            <AnimatePresence initial={false}>
              {activeIndex > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration }}
                  onClick={() => emblaApi?.scrollPrev(Boolean(reducedMotion))}
                  className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                ><ArrowLeft size={15} aria-hidden="true" />Back</motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => close(onSkip ?? onComplete)} className="min-h-11 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Skip</button>
            <button type="button" onClick={handleNext} className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90">
              {activeIndex === slides.length - 1 ? "Get Started" : "Next"}<ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.div>
    </dialog>,
    document.body,
  )
}
