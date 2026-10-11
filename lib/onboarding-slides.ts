export type OnboardingSlide = {
  id: string
  alt: string
  title: string
  description: string
  image: string
}

const photos = {
  canada: "/images/canada.jpg",
  america: "/images/united-states.jpg",
  planning: "/images/onboarding-planning.jpg",
  journey: "/images/onboarding-mountain.jpg",
  horizon: "/images/onboarding-horizon.jpg",
}

export const onboardingSlides: Record<"ca" | "us", readonly OnboardingSlide[]> = {
  ca: [
    {
      id: "welcome",
      title: "Your next chapter starts here.",
      description: "A new life comes with big questions. Let’s turn your plans for Canada into a clearer starting point.",
      image: photos.canada,
      alt: "Toronto’s skyline and the CN Tower beside Lake Ontario",
    },
    {
      id: "profile",
      title: "Start with your story.",
      description: "Share your education, language skills, work experience, and connections. We’ll guide you one question at a time.",
      image: photos.planning,
      alt: "A fountain pen writing on lined paper",
    },
    {
      id: "score",
      title: "See where you stand.",
      description: "Watch your CRS score take shape as you build your profile, and understand the factors behind your score.",
      image: photos.journey,
      alt: "A forested valley surrounded by snow-covered mountains",
    },
    {
      id: "pathways",
      title: "Find your way forward.",
      description: "Start your assessment and explore potential pathways. Your answers help make the next steps more relevant to you.",
      image: photos.horizon,
      alt: "A quiet lakeside landscape with mountains on the horizon",
    },
  ],
  us: [
    {
      id: "welcome",
      title: "Your American chapter awaits.",
      description: "A visit, a degree, a career, a fresh start. Get a little direction for whatever brings you to the United States.",
      image: photos.america,
      alt: "The Statue of Liberty beneath an open New York sky",
    },
    {
      id: "purpose",
      title: "Start with your why.",
      description: "Choose what you have in mind: visiting, studying, working, or making a new home. You can explore each option.",
      image: photos.planning,
      alt: "A fountain pen writing on lined paper",
    },
    {
      id: "routes",
      title: "Get to know your options.",
      description: "Explore visa categories connected to your plans. The U.S. explorer is an introduction; personalized assessments are still to come.",
      image: photos.journey,
      alt: "A forested valley surrounded by snow-covered mountains",
    },
    {
      id: "resources",
      title: "Take your next step.",
      description: "We’ll connect you with official U.S. Department of State guides so you can read the requirements for your journey.",
      image: photos.horizon,
      alt: "A quiet lakeside landscape with mountains on the horizon",
    },
  ],
}
