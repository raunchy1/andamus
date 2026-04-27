// Re-export everything for backwards compatibility
export {
  POINTS,
  LEVELS,
  BADGES,
  getLevelInfo,
  getBadgeDetails,
} from "./gamification-config";
export type { Badge } from "./gamification-config";

export {
  addPoints,
  awardBadge,
  checkRideBadges,
  getUserBadges,
  completeGamificationAction,
} from "./gamification-actions";
