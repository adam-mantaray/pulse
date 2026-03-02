import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync-linear-projects",
  { minutes: 5 },
  internal.linearSync.syncLinearProjects,
);

export default crons;
