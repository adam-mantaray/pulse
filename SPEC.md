# Pulse ⚡ — Product Specification

> Your command center. Set direction, we handle the rest.

**Version:** 1.0 (MVP)
**Author:** Adam Mansour
**Date:** March 2, 2026
**Status:** Draft — Pending Ahmed's approval

---

## 1. Product Overview

Pulse is a mobile-first personal command center for Ahmed Afify. It sits on top of Linear (the team's project management engine) and provides a zero-friction interface for:

- Setting and tracking goals & OKRs
- Building personal habits
- Monitoring AI agent team activity in real-time
- Communicating with agents directly
- Receiving daily briefings

**The core insight:** Ahmed scores 13% on Organization and 19% on Systematic thinking. Pulse must do ALL the organizing. Ahmed's only job is to set direction and check in. The app structures, tracks, reminds, and reports — he taps and swipes.

### Design Philosophy
- **2-Tap Rule:** Any action takes at most 2 taps
- **Zero Data Entry:** Pull everything possible from Linear automatically
- **Glanceable:** Dashboard tells the full story in 3 seconds
- **Proactive:** The app reaches out to Ahmed, not the other way around
- **Beautiful but minimal:** Clean, dark mode default, bold typography, no clutter

---

## 2. User Persona

### Ahmed Afify — Founder & CEO, Mantaray Digital

| Attribute | Detail |
|-----------|--------|
| Role | CEO / Visionary |
| Archetype | Entertainer (Adventurer + Peacekeeper) |
| Curiosity | 76% — Explores constantly |
| Detail-Oriented | 76% — Notices everything |
| Practical | 72% — Wants real-world results |
| Organized | 13% — Needs external structure |
| Systematic | 19% — Won't build processes |
| Dependable | 22% — Follow-through needs support |
| Timezone | Africa/Cairo (GMT+2) |
| Device | iPhone (primary) |

**Key needs:**
- See everything at a glance without digging
- Set goals and forget — the system tracks for him
- Daily accountability nudges
- Direct line to his AI agent team
- Celebrate wins (streaks, progress bars, completion animations)

---

## 3. Core Screens

### 3.1 Dashboard (Home)

The first screen Ahmed sees. Everything important, nothing extra.

**Layout (top to bottom):**

1. **Header:** "Good morning, Ahmed" + date + weather icon
2. **Goals Ring:** Circular progress ring showing overall quarterly goal completion (%)
3. **Today's Habits:** Horizontal row of habit icons — tap to check off. Shows streak count below each.
4. **Active Sprint Card:** Current Linear cycle name, tasks done/total, top 3 in-progress items
5. **Agent Status Bar:** 5 agent avatars in a row. Green dot = active, gray = idle. Tap any to see their current task.
6. **Blockers Banner:** Red banner if any Linear issues are marked as blocked. Tap to see details.
7. **Quick Actions FAB:** Floating button → "New Goal", "Message Agent", "New Habit"

**Interactions:**
- Pull to refresh
- Tap habit → toggle complete (1 tap)
- Tap agent avatar → jump to agent detail
- Tap goals ring → jump to Goals screen
- Tap sprint card → jump to Timeline

### 3.2 Goals & OKRs

Hierarchical goal tracking linked to Linear projects.

**Structure:**
```
Quarter (Q2 2026)
  └── Objective: "Launch Pulse MVP"
        ├── Key Result: "App in TestFlight by April 15" (linked to Linear project)
        │     └── Progress: 12/30 tasks done = 40%
        ├── Key Result: "Agent integration working" 
        │     └── Progress: 3/8 tasks done = 37.5%
        └── Key Result: "Ahmed uses it daily for 1 week"
              └── Progress: manual check-in (0/7 days)
```

**Screen layout:**
- Quarter selector at top (swipe left/right)
- List of Objectives as expandable cards
- Each objective shows overall % and colored progress bar
- Expand to see Key Results with individual progress
- Key Results linked to Linear projects auto-calculate progress
- Key Results not linked to Linear allow manual progress updates

**Creating a goal:**
1. Tap "+" → Choose "Objective" or "Key Result"
2. Type title → optionally link to Linear project → set target date → done

**Auto-sync:** Every 5 minutes, Convex function queries Linear API for linked project task completion and updates progress percentages.

### 3.3 Habits Tracker

Simple daily habit tracking with streaks and history.

**Screen layout:**
- Today's date at top
- List of habits as large, tappable cards
- Each card shows: icon, name, current streak (🔥 number), tap to complete
- Completed habits get a satisfying checkmark animation + haptic feedback
- Bottom: weekly mini-calendar showing dots for completed days
- Swipe left/right to see past days

**Preset habits (Ahmed can customize):**
- 🏋️ Gym
- 🧘 Reflection (20 min alone time)
- 📖 Reading
- 💤 Sleep before midnight
- 💧 Water (8 glasses)

**Creating a habit:**
1. Tap "+" → type name → pick emoji → set frequency (daily/weekdays/custom) → done

**Streak logic:**
- Streak increments for each consecutive day completed
- Missing a day resets to 0
- "Freeze" feature: 1 free pass per week (doesn't break streak)

### 3.4 Timeline

What happened, what's happening, what's coming. Pulled entirely from Linear.

**Screen layout:**
- Segmented control: "Today" | "This Week" | "This Month"
- Vertical timeline with items grouped by date
- Each item shows: task title, assignee (agent avatar), status badge (done/in-progress/blocked), project label
- Color coding: ✅ Green = done, 🔵 Blue = in progress, 🔴 Red = blocked, ⚪ Gray = upcoming
- Filter chips at top: "All" | "Tarek" | "Rami" | "Nadia" | "Adam"

**Data source:** Linear API → issues from team MAN, sorted by updated date.

### 3.5 Agent Feed

Live activity stream — what each agent is working on right now.

**Screen layout:**
- Agent selector: horizontal avatar row at top (tap to filter)
- Feed of activity items, most recent first:
  - "Tarek moved MAN-72 to In Progress" — 5 min ago
  - "Nadia commented on MAN-68: Found a bug in..." — 12 min ago
  - "Adam created MAN-75: Implement habits screen" — 1h ago
  - "Rami completed MAN-70 ✅" — 2h ago
- Each item is tappable → opens Linear issue detail (in-app webview or deep link)

**Data source:** Linear webhook events stored in Convex, or polled every 2 minutes.

### 3.6 Agent Chat

Direct messaging to any agent from within Pulse.

**Screen layout:**
- List of agents with last message preview (like a chat app)
- Tap agent → chat view
- Messages sent from Pulse → routed to agent's OpenClaw session via API
- Agent responses appear in the chat

**Implementation:** 
- Convex table stores messages
- On send: Convex action calls OpenClaw API to deliver message to agent session
- Agent responses: Adam (or the responding agent) writes back via Convex action
- Real-time subscription on Convex for new messages

### 3.7 Briefing Screen

Morning briefing & evening summary, written by Adam.

**Screen layout:**
- Card-based layout
- Morning briefing: "Here's your day" — goals focus, agent assignments, calendar highlights, habit reminder
- Evening summary: "Here's what happened" — tasks completed, blockers, habit completion, tomorrow preview
- Swipe through past briefings

**Data source:** Adam generates briefing content, stores in Convex. Push notification triggers Ahmed to open.

---

## 4. Data Model (Convex)

### Tables

```typescript
// Users
users: defineTable({
  email: v.string(),
  name: v.string(),
  passwordHash: v.string(),
  timezone: v.string(),
  createdAt: v.number(),
})

// Goals / OKRs
objectives: defineTable({
  userId: v.id("users"),
  title: v.string(),
  quarter: v.string(), // "Q2-2026"
  progress: v.number(), // 0-100, auto-calculated
  status: v.union(v.literal("active"), v.literal("completed"), v.literal("archived")),
  createdAt: v.number(),
  updatedAt: v.number(),
})

keyResults: defineTable({
  objectiveId: v.id("objectives"),
  title: v.string(),
  targetValue: v.optional(v.number()),
  currentValue: v.optional(v.number()),
  progress: v.number(), // 0-100
  linearProjectId: v.optional(v.string()), // linked Linear project
  manualTracking: v.boolean(), // true if not linked to Linear
  dueDate: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

// Habits
habits: defineTable({
  userId: v.id("users"),
  name: v.string(),
  emoji: v.string(),
  frequency: v.union(v.literal("daily"), v.literal("weekdays"), v.literal("custom")),
  customDays: v.optional(v.array(v.number())), // 0=Sun, 1=Mon, etc.
  currentStreak: v.number(),
  longestStreak: v.number(),
  freezesUsed: v.number(), // resets weekly
  isActive: v.boolean(),
  createdAt: v.number(),
})

habitCompletions: defineTable({
  habitId: v.id("habits"),
  date: v.string(), // "2026-03-02"
  completedAt: v.number(),
}).index("by_habit_date", ["habitId", "date"])

// Agent Activity Feed
agentActivity: defineTable({
  agentName: v.string(), // "tarek", "nadia", etc.
  action: v.string(), // "moved", "completed", "commented", "created"
  issueId: v.string(), // Linear issue ID
  issueTitle: v.string(),
  details: v.optional(v.string()),
  timestamp: v.number(),
}).index("by_timestamp", ["timestamp"])

// Agent Messages
agentMessages: defineTable({
  userId: v.id("users"),
  agentName: v.string(),
  direction: v.union(v.literal("outbound"), v.literal("inbound")),
  content: v.string(),
  timestamp: v.number(),
  read: v.boolean(),
}).index("by_agent", ["agentName", "timestamp"])

// Briefings
briefings: defineTable({
  userId: v.id("users"),
  type: v.union(v.literal("morning"), v.literal("evening")),
  date: v.string(),
  content: v.string(), // Markdown
  createdAt: v.number(),
}).index("by_date", ["date", "type"])

// Linear Cache (avoid excessive API calls)
linearCache: defineTable({
  projectId: v.string(),
  totalTasks: v.number(),
  completedTasks: v.number(),
  inProgressTasks: v.number(),
  blockedTasks: v.number(),
  lastSynced: v.number(),
}).index("by_project", ["projectId"])
```

---

## 5. Linear API Integration

### Authentication
- Linear API key stored as Convex environment variable
- All Linear calls go through Convex HTTP actions (server-side only)

### Endpoints Used

| Purpose | Linear API | Frequency |
|---------|-----------|-----------|
| Project progress | `projects` query (GraphQL) | Every 5 min (cron) |
| Task list for timeline | `issues` query with team filter | Every 2 min (cron) |
| Issue details | `issue` query by ID | On demand |
| Create task (from goal) | `issueCreate` mutation | On user action |
| Activity feed | `issueHistory` or webhook | Webhook preferred |

### Sync Strategy

```
Convex Cron (every 5 min):
  1. Fetch all active Linear projects for team MAN
  2. For each project: count total, done, in-progress, blocked issues
  3. Update linearCache table
  4. For each keyResult linked to a Linear project:
     - Recalculate progress = completedTasks / totalTasks * 100
     - Update keyResult.progress
  5. For each objective:
     - Recalculate progress = avg of child keyResults progress
     - Update objective.progress
```

### Webhooks (preferred for activity feed)
- Register Linear webhook for team MAN
- Convex HTTP endpoint receives events
- Parse and store in agentActivity table
- Events: IssueCreated, IssueUpdated (state changes), Comment created

---

## 6. Agent Integration

### Architecture

```
Pulse App → Convex → OpenClaw API → Agent Session
                                          ↓
Pulse App ← Convex ← Agent writes back to Convex
```

### Sending Messages (Ahmed → Agent)
1. Ahmed types message in Pulse chat
2. Convex mutation stores message in `agentMessages`
3. Convex action calls OpenClaw gateway API:
   ```
   POST /api/sessions/{agentSessionKey}/send
   Body: { message: "..." }
   ```
4. Agent receives message in their session

### Receiving Messages (Agent → Ahmed)
1. Agent calls a Convex HTTP action endpoint:
   ```
   POST /api/pulse/message
   Body: { agentName, content }
   ```
2. Convex stores in `agentMessages` as inbound
3. Pulse app (subscribed to Convex query) shows new message in real-time
4. Push notification sent via Expo push

### Agent Status
- Each agent periodically updates their status via Convex:
  ```
  { agentName: "tarek", status: "active", currentTask: "MAN-72: Implement dashboard" }
  ```
- Dashboard queries this for the agent status bar

### Briefings
- Adam generates morning/evening briefing content
- Stores via Convex action into `briefings` table
- Triggers Expo push notification to Ahmed

---

## 7. UI/UX Principles

### The 2-Tap Rule
Every primary action must be completable in ≤ 2 taps:
- Check off habit: 1 tap
- See agent's current task: 1 tap (avatar on dashboard)
- Create a new goal: 2 taps (FAB → fill title → done)
- Message an agent: 2 taps (agent list → type & send)

### Zero Friction Design
- No onboarding tutorial — the app is self-explanatory
- No settings sprawl — minimal config, smart defaults
- No manual data entry where automation exists
- Pre-filled suggestions everywhere (habit templates, goal templates)

### Visual Design — Ledgerly Design System (shared)

Pulse reuses the **exact same design system** from Ledgerly (Budgetly). Same Restyle theme, same primitives, same fonts. This gives visual consistency across Mantaray apps and saves build time.

**Framework:** `@shopify/restyle` — same theme-driven approach

**Color Palette (light — default):**
```
bg:            '#FAF5EB'    // warm cream background
bgSecondary:   '#F0E9DA'    // secondary surfaces
card:          '#FFFFFF'    // card backgrounds
cardWarm:      '#FBF8F2'    // warm card variant
textPrimary:   '#2D2A23'    // primary text
textSecondary: '#6B6558'    // secondary text
textTertiary:  '#A09A8C'    // labels, hints
accent:        '#2D5F3F'    // primary action color (forest green)
accentLight:   '#E8F0EB'    // accent tint for backgrounds
accentWarm:    '#8B6E4E'    // warm accent (secondary actions)
border:        '#E5DFD2'    // borders & dividers
gold:          '#C49A3F'    // warning / streaks
```

**Color Palette (dark):**
```
bg:            '#1A1F1C'    // deep forest background
bgSecondary:   '#242A26'
card:          '#2D332F'
textPrimary:   '#F0EAE0'
accent:        '#4A8B5E'    // brighter green for dark mode
border:        '#3D4339'
```

**Pulse-specific semantic colors (extend the palette):**
```
success:       income color (#3A7D53 light / #5AA06D dark) — goal completed, habit done
danger:        expense color (#C45C3E light / #E07054 dark) — blockers, overdue
streak:        gold (#C49A3F / #D4A94F) — habit streaks, celebrations
agentActive:   accent (#2D5F3F / #4A8B5E) — agent online
agentIdle:     textTertiary (#A09A8C / #7D7869) — agent idle
```

**Typography:** Same font stack
- **Fraunces** (Bold/SemiBold) — display headers, numbers, goal percentages
- **DM Sans** (Regular/Medium/SemiBold) — body text, labels, buttons
- Text variants: `displayLarge`, `heading`, `subheading`, `body`, `bodySmall`, `label`, `button`, `amount`

**Spacing:** `xs:4, s:8, m:12, md:16, l:20, xl:24, 2xl:32, 3xl:48`
**Border Radii:** `sm:10, md:16, lg:20, xl:24, pill:9999`

**Shared Primitives (copy from Ledgerly `src/design/primitives/`):**
- `Box` — Restyle-powered View
- `Text` — Restyle-powered Text with variants
- `Card` — with `defaults`, `elevated`, `warm` variants
- `Button` — with `primary`, `outline`, `danger`, `ghost` variants
- `Input` — styled text input
- `BottomSheet` — bottom sheet component
- `SafeArea` — safe area wrapper

**Haptic feedback** on habit completions
**Animations:** Smooth, celebratory (confetti on goal completion, checkmark bounce on habit)

### Built for Low-Organization Users
- Smart defaults over configuration
- Auto-archive completed goals after 2 weeks
- Habit reminders at configurable times (default: 9 AM, 9 PM)
- Dashboard auto-refreshes — no manual sync needed
- Notifications are actionable (tap notification → complete habit directly)

---

## 8. Phase Breakdown

### Phase 1 — MVP (Target: 3-4 weeks)

**Must have:**
- [ ] Auth (email/password login)
- [ ] Dashboard with goals ring, habits row, agent status
- [ ] Habits: create, complete, streak tracking
- [ ] Goals: create objectives & key results, manual progress
- [ ] Linear integration: project progress sync, timeline view
- [ ] Agent status display (read-only)
- [ ] Push notifications (habit reminders)

**Out of scope for MVP:**
- Agent messaging (use Discord for now)
- Agent feed (use Linear directly)
- Briefings (Adam sends via Discord)
- Webhooks (use polling)

### Phase 2 — Full Experience (Target: 2-3 weeks after MVP)

- [ ] Agent chat (send/receive messages in-app)
- [ ] Agent activity feed
- [ ] Morning/evening briefings in-app
- [ ] Linear webhooks (replace polling)
- [ ] Goal templates ("Launch a product", "Grow revenue", etc.)
- [ ] Habit insights (weekly/monthly charts)
- [ ] Widget for iOS home screen (today's habits + goals %)
- [ ] Light mode option

### Phase 3 — Polish & Scale

- [ ] Multiple users (team members can have their own Pulse)
- [ ] Android support
- [ ] Calendar integration (Google Calendar)
- [ ] Voice input for quick goal/habit creation
- [ ] AI-generated goal suggestions based on past patterns
- [ ] Export/reports (weekly PDF summary)

---

## 9. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Daily active usage | Ahmed opens Pulse every day | Convex analytics |
| Habit completion rate | >60% of habits completed daily | habitCompletions / active habits |
| Goal progress visibility | Ahmed checks goals 3x/week | Screen view tracking |
| Agent communication | >5 messages/week via Pulse | agentMessages count |
| Reduced Discord dependency | Ahmed uses Pulse as primary dashboard | Qualitative feedback |
| Time to check status | <10 seconds to know "what's happening" | UX observation |

---

## 10. Open Questions

1. **Convex deployment:** Use Adam's existing Convex account or new project?
2. **Push notification service:** Expo Push or separate service?
3. **Linear webhook endpoint:** Need a public URL — Convex HTTP actions handle this natively
4. **Agent API authentication:** How do agents authenticate to write to Convex?
5. **Offline support:** Should habits work offline? (Recommended: yes, sync when back online)

---

## 11. File Structure (Proposed)

```
pulse/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx       # Dashboard
│   │   ├── goals.tsx       # Goals & OKRs
│   │   ├── habits.tsx      # Habits tracker
│   │   ├── timeline.tsx    # Timeline
│   │   └── agents.tsx      # Agent feed + chat
│   ├── _layout.tsx
│   ├── login.tsx
│   └── goal/[id].tsx       # Goal detail
├── components/
│   ├── GoalRing.tsx
│   ├── HabitCard.tsx
│   ├── AgentAvatar.tsx
│   ├── TimelineItem.tsx
│   └── BriefingCard.tsx
├── convex/
│   ├── schema.ts
│   ├── users.ts
│   ├── objectives.ts
│   ├── keyResults.ts
│   ├── habits.ts
│   ├── habitCompletions.ts
│   ├── agentActivity.ts
│   ├── agentMessages.ts
│   ├── briefings.ts
│   ├── linearCache.ts
│   ├── linearSync.ts       # Cron job for Linear sync
│   └── http.ts             # HTTP endpoints for agent callbacks
├── hooks/
│   ├── useHabits.ts
│   ├── useGoals.ts
│   └── useAgents.ts
├── lib/
│   ├── linear.ts           # Linear API client
│   └── notifications.ts    # Push notification setup
├── constants/
│   └── theme.ts
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── SPEC.md                 # This file
```

---

*Spec written by Adam Mansour. Ready for Ahmed's approval, then build assignment.*
