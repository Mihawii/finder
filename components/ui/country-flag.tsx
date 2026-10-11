import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

// Flag + label treatment informed by 21st.dev MCP's Language Selector Dropdown.
// https://21st.dev/@samsiavoshian2009/components/language-selector-dropdown
// Static local assets retain the national flags' original proportions and colors.
export function CountryFlag({ country, className, ...props }: Omit<ComponentProps<"img">, "src" | "alt"> & { country: "us" | "ca" }) {
  return <img src={`/images/${country}-flag.svg`} alt="" aria-hidden="true" className={cn("country-flag", className)} {...props} />
}
