import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync-linear-projects",
  { minutes: 5 },
  internal.linearSync.syncLinearProjects,
);

crons.daily(
  "reset-missed-habit-streaks",
  { hourUTC: 22, minuteUTC: 1 },
  internal.habits.resetMissedStreaks,
);

export default crons;
