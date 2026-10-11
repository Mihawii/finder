export type OnboardingSlide = {
  id: string
  title: string
  description: string
}

export const onboardingSlides: Record<"ca" | "us", readonly OnboardingSlide[]> = {
  ca: [
    {
      id: "profile",
      title: "Build your profile",
      description: "Answer a few questions about your education, work, and languages.",
    },
    {
      id: "results",
      title: "See your options",
      description: "Get your CRS score and explore Canadian immigration pathways.",
    },
  ],
  us: [
    {
      id: "purpose",
      title: "Choose your purpose",
      description: "Visit, study, work, or move to the U.S.",
    },
    {
      id: "guide",
      title: "Get the right guide",
      description: "Open official visa requirements for your plans.",
    },
  ],
}
