import { IconMotorbike, IconUser } from "@tabler/icons-react";

// Only the tabs that exist so far; Active delivery, History and Earnings
// (AGENTS.md §6 Rider navigation) are added as those screens are built.
export const riderTabs = [
  { href: "/rider", icon: IconMotorbike, label: "Jobs" },
  { href: "/rider/profile", icon: IconUser, label: "Profile" },
];
