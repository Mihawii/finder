import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary"
}

// The primary/quiet-secondary hierarchy follows the 21st.dev onboarding source;
// pill geometry and colors reuse PathwayFinder's existing landing-page CTA.
export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn("pathway-button", `pathway-button--${variant}`, className)} {...props} />
}
