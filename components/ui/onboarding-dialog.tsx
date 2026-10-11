import * as React from "react"
import { createPortal } from "react-dom"
import { motion, useReducedMotion } from "motion/react"
import useEmblaCarousel from "embla-carousel-react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { onboardingSlides, type OnboardingSlide } from "@/lib/onboarding-slides"

// Adapted from 21st.dev MCP: https://21st.dev/@patrick-xin/components/onboarding-dialog

export type OnboardingDialogProps = {
  defaultOpen?: boolean
  slides?: readonly OnboardingSlide[]
  onComplete?: () => void
  onSkip?: () => void
  onDismiss?: () => void
  showRestart?: boolean
  completeLabel?: string
}

export function OnboardingDialog({
  defaultOpen = true,
  slides = onboardingSlides.ca,
  onComplete,
  onSkip,
  onDismiss,
  showRestart = true,
  completeLabel = "Continue",
}: OnboardingDialogProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const reducedMotion = useReducedMotion()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, duration: reducedMotion ? 0 : 20 })
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()
  const currentSlide = slides[activeIndex] ?? slides[0]
  const isLastSlide = activeIndex === slides.length - 1

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
    dialog.focus({ preventScroll: true })
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !document.querySelector("dialog[open]")) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [open])

  // Measure after the native dialog opens, including when the demo restarts.
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

  if (!currentSlide) return null

  if (!open) {
    return showRestart ? (
      <Button
        onClick={() => { setActiveIndex(0); setOpen(true) }}
      >
        Restart Onboarding
      </Button>
    ) : null
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="onboarding-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground backdrop:bg-black/65"
      onCancel={(event) => { event.preventDefault(); close(onDismiss) }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"))
          const first = buttons[0]
          const last = buttons[buttons.length - 1]
          if (document.activeElement === event.currentTarget) { event.preventDefault(); (event.shiftKey ? last : first)?.focus() }
          else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
        if (event.key === "ArrowRight") { event.preventDefault(); emblaApi?.scrollNext(Boolean(reducedMotion)) }
        if (event.key === "ArrowLeft") { event.preventDefault(); emblaApi?.scrollPrev(Boolean(reducedMotion)) }
      }}
    >
      <motion.div initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }} className="relative p-3">
        <button type="button" onClick={() => close(onDismiss)} aria-label="Close onboarding" className="onboarding-close absolute top-5 right-5 z-10 flex size-9 items-center justify-center rounded-full">
          <X size={16} aria-hidden="true" />
        </button>
        <div ref={emblaRef} className="overflow-hidden" role="region" aria-roledescription="carousel" aria-label="Getting started">
          <div className="flex touch-pan-y">
            {slides.map((slide, index) => (
              <div key={slide.id} className="min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} aria-hidden={index !== activeIndex}>
                <img src={slide.image} alt={slide.alt} width={1200} height={675} draggable={false} className="block aspect-video h-auto w-full rounded-lg object-cover" />
                <div className="px-2 pt-4">
                  <h2 id={index === activeIndex ? titleId : undefined} className="text-xl leading-7 font-semibold tracking-tight">{slide.title}</h2>
                  <p id={index === activeIndex ? descriptionId : undefined} className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only" aria-live="polite" aria-atomic="true">{currentSlide.title}</span>
        <div className="mt-4 flex items-center justify-between gap-2 px-1 pb-1">
          {slides.length === 1 ? (
            <Button variant="secondary" onClick={() => close(onDismiss)}>Back</Button>
          ) : activeIndex > 0 ? (
            <Button variant="secondary" onClick={() => emblaApi?.scrollPrev(Boolean(reducedMotion))}>Back</Button>
          ) : (
            <Button variant="secondary" onClick={() => close(onSkip ?? onComplete)}>Skip</Button>
          )}
          <Button onClick={() => isLastSlide ? close(onComplete) : emblaApi?.scrollNext(Boolean(reducedMotion))}>
            {isLastSlide ? completeLabel : "Next"}
          </Button>
        </div>
      </motion.div>
    </dialog>,
    document.body,
  )
}
