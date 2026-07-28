import {
  CampaignDurationType,
  ExperienceLevel,
  HostingStatus,
  Platform
} from "@prisma/client";

export const PLAY_STYLE_TAGS = [
  "Casual",
  "Serious",
  "Competitive",
  "Relaxed",
  "Roleplay",
  "Building",
  "Exploration",
  "Progression",
  "Completionist",
  "Modded",
  "Vanilla",
  "Beginner-friendly",
  "Experienced players",
  "PvE",
  "PvP",
  "Long-term world",
  "Short campaign"
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  PC: "PC",
  XBOX: "Xbox",
  PLAYSTATION: "PlayStation",
  NINTENDO_SWITCH: "Nintendo Switch",
  CROSS_PLATFORM: "Cross-platform",
  OTHER: "Other"
};

export const HOSTING_LABELS: Record<HostingStatus, string> = {
  OWNER_HOSTING: "I am hosting",
  MEMBER_HOSTING: "Another member is hosting",
  NEED_HOST: "We need someone who can host",
  DEDICATED_SERVER: "Dedicated server exists",
  UNDECIDED: "Hosting not decided"
};

export const DURATION_LABELS: Record<CampaignDurationType, string> = {
  ONE_SESSION: "One session",
  SEVERAL_SESSIONS: "Several sessions",
  WEEKEND: "Weekend",
  ONE_WEEK: "One week",
  TWO_WEEKS: "Two weeks",
  CUSTOM_RANGE: "Custom date range",
  ONGOING: "Ongoing campaign"
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: "Beginner",
  CASUAL: "Casual",
  EXPERIENCED: "Experienced",
  EXPERT: "Expert",
  ANY: "Any experience"
};

export const LISTING_FRESHNESS_DAYS = 7;
