import { OnboardingDialog } from "@/components/ui/onboarding-dialog"

export default function Demo() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <OnboardingDialog defaultOpen={true} />
    </div>
  )
}
