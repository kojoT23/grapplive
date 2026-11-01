import { IconMotorbike, IconRoute, IconUser } from "@tabler/icons-react";

// Only the tabs that exist so far; History and Earnings (AGENTS.md §6 Rider
// navigation) are added as those screens are built (ROADMAP.md §11 step 3).
export const riderTabs = [
  { href: "/rider", icon: IconMotorbike, label: "Jobs" },
  { href: "/rider/active", icon: IconRoute, label: "Active" },
  { href: "/rider/profile", icon: IconUser, label: "Profile" },
];
