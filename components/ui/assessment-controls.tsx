import { useEffect, useId, useRef, useState, type ComponentProps } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SelectProps = ComponentProps<"select"> & { options: readonly string[]; placeholder?: string }

export function AssessmentSelect({ options, placeholder = "Select an option", className, ...props }: SelectProps) {
  return <div className="assessment-select">
    <select className={cn("assessment-input", className)} {...props}>
      <option value="">{placeholder}</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    <ChevronDown size={16} aria-hidden="true" />
  </div>
}

type ChoiceProps = {
  id: string
  value: string
  onChange: (value: string) => void
  options?: readonly string[]
  invalid?: boolean
  describedBy?: string
}

export function AssessmentChoice({ id, value, onChange, options = ["Yes", "No"], invalid, describedBy }: ChoiceProps) {
  return <div className="assessment-choice" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} aria-invalid={invalid || undefined}>
    {options.map((option, index) => <label key={option} className={cn("assessment-choice-option", value === option && "is-selected")}>
      <input id={index === 0 ? id : `${id}-${index}`} type="radio" name={id} value={option} checked={value === option} onChange={() => onChange(option)} />
      <span>{option}</span>
      <span className="assessment-choice-indicator" aria-hidden="true">{value === option && <Check size={12} strokeWidth={2.5} />}</span>
    </label>)}
  </div>
}

type ComboboxProps = Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
}

export function AssessmentCombobox({ value, onChange, options, ...props }: ComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const list = useRef<HTMLUListElement>(null)
  const matches = options.filter(option => option.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => { if (value) setQuery(value) }, [value])
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  const select = (option: string) => {
    setQuery(option)
    onChange(option)
    setOpen(false)
  }

  return <div className="assessment-combobox">
    <div className="assessment-select">
      <input {...props} className="assessment-input" role="combobox" autoComplete="off" spellCheck={false}
        value={query} aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        onFocus={() => { setOpen(true); setActive(0) }}
        onBlur={() => { setOpen(false); if (!value) setQuery("") }}
        onChange={event => { setQuery(event.target.value); onChange(""); setActive(0); setOpen(true) }}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setOpen(true)
            setActive(index => open ? Math.max(0, Math.min(matches.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))) : 0)
          } else if (event.key === "Enter" && open) {
            event.preventDefault()
            if (matches[active]) select(matches[active])
          } else if (event.key === "Escape") {
            event.preventDefault()
            setOpen(false)
          }
        }} />
      <ChevronDown size={16} aria-hidden="true" />
    </div>
    {open && <ul ref={list} className="assessment-options" role="listbox" id={listId} aria-label="Countries">
      {matches.length ? matches.map((option, index) => <li key={option} id={`${listId}-${index}`} role="option" aria-selected={value === option}
        className={cn(index === active && "is-active")} onPointerMove={() => setActive(index)}
        onMouseDown={event => event.preventDefault()} onClick={() => select(option)}>
        {option}{value === option && <Check size={14} aria-hidden="true" />}
      </li>) : <li className="assessment-no-options" role="presentation">No match. Choose “Other” if your country isn’t listed.</li>}
    </ul>}
  </div>
}

type Step = { id: string; label: string }

// Adapted from the progress states in 21st.dev's Multi-step Wizard (demo 7821).
// https://21st.dev/@dhileepkumargm/components/multi-step-wizard
export function AssessmentStepper({ steps, active, completed, available, onSelect }: {
  steps: Step[]; active: number; completed: boolean[]; available: number; onSelect: (index: number) => void
}) {
  return <nav className="assessment-stepper" aria-label="Assessment sections">
    <ol>{steps.map((step, index) => <li key={step.id} className={cn(index === active && "is-current", completed[index] && "is-complete")}>
      <button type="button" disabled={index > available} aria-current={index === active ? "step" : undefined}
        aria-label={`${step.label}${completed[index] ? ", complete" : ""}`} onClick={() => onSelect(index)}>
        <span className="assessment-step-mark" aria-hidden="true">{completed[index] && index !== active ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span>
        <span className="assessment-step-label">{step.label}</span>
      </button>
    </li>)}</ol>
  </nav>
}
