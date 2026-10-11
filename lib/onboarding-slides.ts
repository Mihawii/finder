export type OnboardingSlide = {
  id: string
  title: string
  description: string
  image: string
  alt: string
}

export const onboardingSlides: Record<"ca" | "us", readonly OnboardingSlide[]> = {
  ca: [
    {
      id: "profile",
      title: "Build your profile",
      description: "Answer a few questions about your education, work, and languages.",
      image: "/images/canada.jpg",
      alt: "Toronto’s skyline beside Lake Ontario",
    },
    {
      id: "results",
      title: "Your personalized plan",
      description: "See your CRS score, matched pathways, and next steps.",
      image: "/images/onboarding-horizon.jpg",
      alt: "A mountain lake surrounded by forests",
    },
  ],
  us: [
    {
      id: "availability",
      title: "U.S. assessments",
      description: "Personalized assessments currently cover Canada. U.S. assessments aren’t available yet.",
      image: "/images/united-states.jpg",
      alt: "The Statue of Liberty beneath an open sky",
    },
  ],
}
