# Pulse ⚡ — Product Specification v2.1

> One system. Vision → Quarter → Day. All connected.

**Version:** 2.1  
**Author:** Omar Selim (Blueprint)  
**Date:** March 3, 2026  
**Status:** Ready for build — Ahmed approved direction  
**Supersedes:** SPEC-V2.md (v2.0), SPEC.md (v1.0)

---

## 1. Product Philosophy

Pulse is Ahmed's daily driver. Not a project management tool. Not a habit tracker. Not a goal-setting exercise.

**It is the one app Ahmed opens every morning and closes every night.**

Everything in Pulse should earn that slot. Every screen, every interaction, every notification must pass one test: *does this help Ahmed act on his vision today?*

The three-layer model:

```
Harada Chart (Vision Layer)
   └── Main Goal: Who Ahmed wants to become / what he's building toward
   └── Sub-Goals (8): Life areas — health, business, learning, relationships, etc.
   └── Actions (64): Specific commitments that make sub-goals real
         └── Sub-Tasks: The actual work — broken down, assignable, trackable
                │
                ▼  promote (one tap)
                ├── → Habit: daily behavior ("do this every day")
                ├── → Key Result: quarterly measurable ("hit this by Q2 end")
                └── → Agent Task: "Blueprint, flesh this out" / "Tarek, build this"

OKR Layer (Quarterly)
   └── Objectives with Key Results (some auto-tracked, some manual)
   └── KRs trace back to Harada actions when promoted
   └── KR hits 100% → linked Harada action auto-marks done

Habit Layer (Daily)
   └── Each habit optionally linked to a Harada sub-goal
   └── Completing habits = executing the vision
   └── Every habit shows its "why" (subtle sub-goal label)
```

This isn't three tabs. It's one system with three zoom levels. Ahmed sets the vision once. The system handles the tracking, delegation, and accountability.

---

## 2. Design Principles

### Built for ADHD
Ahmed scores 13% on Organization, 19% on Systematic thinking. This shapes every decision:

- **Visual progress, not numbers** — rings, fills, color. Don't make him calculate.
- **Dopamine hits built in** — streak animations, completion bursts, milestones
- **Quick wins always visible** — dashboard shows what's done, not what's left
- **Zero wall of text** — cards, icons, one-liners. Long content collapsed by default.
- **2-tap max** — any primary action in 2 taps or fewer
- **Proactive, not passive** — app reaches out, not the other way around
- **Context without overwhelm** — show the "why" behind each habit and task, but don't force navigation

### The "Why" Principle
Every habit card shows its Harada sub-goal in muted text — subtle, not loud. Ahmed sees the thread from today's habit to his lifetime vision at a glance without it being in his face.

### Not Everything Has a Metric
Some goals are qualitative. Some commitments are personal. The system handles both:
- **Auto-tracked:** linked to Linear issue or numeric KR — progress is automatic
- **Manual check-off:** Ahmed marks it done when he decides it's done
- **Agent-delegated:** assigned to an agent to flesh out or execute

Don't force a number where there isn't one.

---

## 3. Navigation (Renamed Tabs)

| Tab | Icon | Name | Purpose |
|-----|------|------|---------|
| 1 | Home | **Home** | Unified daily command center |
| 2 | Eye / Compass | **Vision** | Harada chart — the north star |
| 3 | Target | **OKRs** | Quarterly goals and key results |
| 4 | Flame | **Habits** | Daily behavior and streaks |
| 5 | Users | **Team** | Agent feed and chat |

---

## 4. Screen Specifications

### 4.1 Home — Unified Command Center

The first screen Ahmed sees. All three layers in one scroll. Everything connected.

**Layout (top to bottom):**

#### A. Daily Greeting
- "Good morning, Ahmed" + current date
- Subtle motivational line: *"Toward: [Main Goal text]"* — pulled from active Harada chart
- If no active chart: *"Set your north star →"* (tappable, goes to Vision)

#### B. Vision Ring
- Two concentric circular rings:
  - **Outer ring:** % of Harada actions marked done (completion)
  - **Inner ring:** % of actions filled (planning complete)
- Center: main goal title (max 2 lines, truncated)
- Animated fill on load
- Color: 0–33% muted, 34–66% amber, 67–100% accent green
- Tap → Vision tab

#### C. Focus (Pomodoro Quick-Start) — NEW
- Compact card below the ring
- If a pomodoro is running: countdown timer, current task label, pause/stop controls
- If idle: "What are you working on?" → tap → Pomodoro screen (start session)
- Today's focus count: "3 sessions today · 75 min focused"

#### D. Today's Habits
- "X/Y done" count as section header
- Horizontal scrollable row of habit chips
- Each chip: emoji + name + 🔥 streak + muted sub-goal tag below name
- Tap → complete (1 tap, optimistic, haptic)
- Long-press → habit detail

#### E. Quarter at a Glance
- "Q2 2026" header + overall progress %
- Max 3 objectives shown as compact cards (name + mini progress bar)
- "See all" → OKRs tab
- Each card tappable → objective detail

#### F. Agent Status
- Horizontal row of 5 agent avatars
- Green dot = active, gray = idle
- One-line current task below each (truncated)
- Tap → Team tab filtered to that agent

#### G. Blockers (conditional)
- Red/orange banner only if blocked Linear issues exist
- "2 tasks blocked — tap to review"
- Dismissible per session

#### H. Quick Actions FAB
→ Bottom sheet:
- 🍅 Start focus session
- ✅ Mark habit done (quick-complete without opening tab)
- 💬 Message Adam
- 💡 Add a thought (quick note → saved, surfaces in next briefing)

---

### 4.2 Vision — Harada Screens

The anchor of everything. All other features trace back to this tab.

#### Screen A: Chart List
- Cards: chart title, main goal, X/8 sub-goals set, X/64 actions filled, X done
- "Active" badge on the current active chart
- Only one chart can be "active" at a time
- FAB → create new chart (new chart becomes active automatically)
- Long-press existing chart → "Set as Active" / "Archive" / "Delete"

#### Screen B: Mandala Overview (read mode)
- 9x9 grid — the visual poster of the vision
- Viewing surface, not the primary edit surface
- Tap any sub-goal block (the colored center cells in surrounding 3x3 blocks) → Sub-Goal Drill-Down
- Tap main goal center cell → inline edit (just one field, simple)
- Header: chart title + progress badge ("12/64 done")
- Edit icon top-right → enters full edit mode (focuses on sub-goal list view)

#### Screen C: Sub-Goal Drill-Down (primary edit and work surface)
- Full screen for one sub-goal at a time
- **Header:** sub-goal name (tap to edit inline) + color swatch for that sub-goal
- **Navigation:** ← → arrows to move between all 8 sub-goals
- **Action list:** 8 action rows, large and tappable (~72px each)
  - Left: checkbox/done toggle (tap to complete)
  - Center: action text + tracking type badge (auto / manual / agent)
  - Right: chevron → Action Detail screen
  - Done actions: faded text, checkmark
- **Progress bar** at top: X/8 actions done for this sub-goal
- **FAB:** "Add sub-task" (actually adds a task under an existing action — wait, no. The 8 cells are fixed in Harada. FAB here doesn't make sense. Sub-tasks are under each action, accessed via Action Detail.)

> **Clarification on structure:** The 8 action cells in each sub-goal block are fixed Harada methodology — they don't expand. Sub-tasks live *under* each action, accessed by tapping the action row.

#### Screen D: Action Detail Screen (new — core work surface)
- Header: sub-goal name + action text
- **Tracking type selector:** "Manual" | "Auto (Linear)" | "Agent" — toggle at top
  - Manual: simple done/undone, Ahmed decides when complete
  - Auto: link to Linear issue or numeric KR — shows auto-progress
  - Agent: shows delegation controls (see below)
- **Sub-tasks section:**
  - List of sub-tasks under this action
  - Each sub-task: checkbox (done), title, assigned agent name (if any), status badge
  - Swipe left on sub-task → delete
  - Tap sub-task → Sub-Task Detail (see Screen E)
  - FAB / "+ Add sub-task" → inline text input to add quickly
- **Pomodoro quick-start:** "🍅 Focus on this" button → starts pomodoro pre-linked to this action
- **Promote section:**
  - "Make this a Habit" → Habit creation sheet (pre-filled)
  - "Make this a Key Result" → KR creation sheet (pre-filled)
  - If already promoted: shows "Linked Habit: [name]" / "Linked KR: [name]"
- **Progress context:**
  - If tracking type = Auto: shows current KR/Linear progress
  - If tracking type = Manual: shows sub-task completion X/Y
  - If tracking type = Agent: shows delegation status

#### Screen E: Sub-Task Detail / Agent Delegation (new)
This is where the flesh-out → approve → execute flow lives.

**States:**

**State 1 — Todo (not yet assigned)**
- Sub-task title (editable)
- Notes field (optional — Ahmed can add context)
- Assign to agent: dropdown of agents (Blueprint, Tarek, Rami, Ziad, Nadia)
- Assignment type: "Flesh out" or "Execute directly"
- [Send to Agent] button

**State 2 — Flesh Out (agent is writing the plan)**
- Status card: "Blueprint is working on this plan..."
- Spinner / last updated time
- [Cancel] button

**State 3 — Pending Review (plan ready)**
- Full-width card showing the agent's plan/spec (markdown rendered)
- Agent name + "ready for your review"
- [Approve & Send to Execute] button (sends back to same agent or choose different one)
- [Request Changes] button → opens text input → sends feedback back to agent
- [Reject] button → returns to Todo state

**State 4 — Approved / Executing**
- Status card: "Tarek is building this..."
- Progress notes from agent (optional updates)
- Last updated time

**State 5 — Done**
- Completion card: agent name + completion summary (brief notes)
- Completed timestamp
- Action cell auto-marks done if all sub-tasks are done

**Agent communication flow (backend):**
1. Ahmed taps [Send to Agent] → Convex mutation updates task status to `fleshing_out`
2. Convex action sends structured message to agent's OpenClaw session:
   ```
   Task for flesh-out:
   Vision: [Main Goal]
   Sub-Goal: [Sub-Goal name]
   Action: [Action text]
   Task: [Sub-task title]
   Context: [Ahmed's notes]
   
   Please write a detailed plan/breakdown for this task.
   When done, update the task via: POST /api/pulse/tasks/{taskId}/flesh-out
   ```
3. Agent completes plan → calls Convex HTTP endpoint → status → `pending_review`, push notification to Ahmed
4. Ahmed reviews in Pulse → taps [Approve] → status → `approved`, agent notified via OpenClaw
5. Agent executes → updates status → `executing` → eventually `done`
6. Ahmed sees completion in Pulse

---

### 4.3 OKRs — Quarterly Goals

Minimal changes from v1. Add tracking type and Harada trace.

**Changes:**
- Key Result creation: "Tracking" selector — "Numeric target" / "Linear project" / "Manual check-off"
  - Numeric: enter target value, update current value manually or via Linear
  - Linear: link to project, auto-calculates from task completion
  - Manual: Ahmed marks done when he decides
- KR cards show Harada origin tag if promoted: *"↑ From Vision: [Action]"* — subtle, muted
- KR reaching 100% auto-marks linked Harada action as done (server-side Convex function)
- No other structural changes — layout, quarter selector, objective cards all stay

---

### 4.4 Habits — Daily Behavior

**Changes:**
- Habit card (compact): emoji + name + 🔥 streak + sub-goal tag (muted, one word or short label)
- Sub-goal tag only shown if habit is linked — not shown for standalone habits
- Habit creation: optional "Link to Vision" section — shows sub-goals from active Harada chart as selectable chips
- Habit detail: "Part of [Sub-Goal]" section with link to drill-down view
- Streak milestones (7, 30, 100 days): celebration card references the linked sub-goal — "7 days of [Habit]. [Sub-Goal] is happening. 🔥"
- No changes to streak logic, completion, or freeze mechanics

---

### 4.5 Focus — Pomodoro Timer (New Screen/Modal)

Built for ADHD. Non-negotiable daily driver feature.

**Entry points:**
- Home dashboard → "What are you working on?" card
- Any action or sub-task → "🍅 Focus on this" button
- Home FAB → "Start focus session"

**Screen layout:**

**Header:** "Focus Session" + optional task context (linked task name if launched from a task)

**Timer display:**
- Large circular countdown (like a clock face, filling as time passes)
- Big number: minutes:seconds remaining
- Below: session type — "Focus" (25 min) or "Break" (5 min)

**Task label:**
- Text field: "What are you working on?" — pre-filled if launched from a task, editable otherwise
- If linked to a Harada action: shows sub-goal context below in muted text

**Controls:**
- [Start / Pause] — large, prominent
- [Stop] — smaller, secondary (ends session, logs it as interrupted)
- [+5 min] — extension button (visible when < 5 min remain)

**Session settings (accessible via gear icon):**
- Focus duration: 15 / 25 / 45 / 60 min (default 25)
- Break duration: 5 / 10 / 15 min (default 5)
- Auto-start break after focus: toggle (default on)
- Notification sound: toggle

**On focus complete:**
- Haptic + sound
- Celebration: "Session complete ✓" + streak ("3 sessions today")
- If linked to a task: "Mark task as done?" → tap Yes → task updates
- [Start break] or [Done for now]

**Today's stats bar (always visible at bottom):**
- 🍅 X sessions · Y min focused
- If linked to actions: shows which actions got focus today

**Data logged per session:**
- Task/action link (optional)
- Actual duration (in case they stopped early)
- Interrupted: true/false
- Timestamp

---

### 4.6 Team — Agent Feed & Chat

No structural changes. Minor addition:

- **Task notifications:** When an agent completes a flesh-out or execution, a message appears in the agent's chat thread: "I've finished fleshing out [Task name]. Review it in Pulse → Vision → [Action]."
- Agent chat becomes the async communication layer for delegated tasks

---

## 5. Data Model (Full Schema — v2.1)

Complete schema including all new tables. Bold = new in v2.1.

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ── Users ──────────────────────────────────────────────────────
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    timezone: v.string(),
    createdAt: v.number(),
    // NEW: pointer to active Harada chart
    activeHaradaChartId: v.optional(v.id("haradaCharts")),
  }).index("by_email", ["email"]),

  // ── Harada ─────────────────────────────────────────────────────
  haradaCharts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    mainGoal: v.string(),
    subGoals: v.array(v.string()),          // 8 sub-goals
    actions: v.array(v.array(v.string())),  // 8x8 action text
    // NEW: completion + active state
    actionsDone: v.array(v.array(v.boolean())), // 8x8 done flags
    isActive: v.boolean(),                  // only one active at a time
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // NEW: Sub-tasks under each Harada action cell
  haradaTasks: defineTable({
    userId: v.id("users"),
    chartId: v.id("haradaCharts"),
    subGoalIndex: v.number(),       // 0–7: which sub-goal
    actionIndex: v.number(),        // 0–7: which action within sub-goal
    title: v.string(),
    notes: v.optional(v.string()),  // Ahmed's context/notes

    // How this task is tracked
    trackingType: v.union(
      v.literal("manual"),          // Ahmed marks done himself
      v.literal("linear"),          // auto-tracked via Linear issue
      v.literal("agent"),           // assigned to an agent
    ),

    // Lifecycle status
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),     // Ahmed is actively working on it (pomodoro running)
      v.literal("fleshing_out"),    // agent is writing the plan
      v.literal("pending_review"),  // agent plan ready, Ahmed hasn't reviewed
      v.literal("approved"),        // Ahmed approved plan, ready to execute
      v.literal("executing"),       // agent is doing the work
      v.literal("done"),
    ),

    // Linear link (trackingType = "linear")
    linearIssueId: v.optional(v.string()),
    linearIssueUrl: v.optional(v.string()),
    linearProgress: v.optional(v.number()), // 0–100, synced from Linear

    // Agent delegation (trackingType = "agent")
    assignedAgentName: v.optional(v.string()), // "blueprint", "tarek", "rami", "ziad", "nadia"
    fleshOutPlan: v.optional(v.string()),       // markdown plan written by agent
    fleshOutAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    executionNotes: v.optional(v.string()),     // agent's final notes on completion
    completedAt: v.optional(v.number()),

    sortOrder: v.number(),          // ordering within an action's task list
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_chart_action", ["chartId", "subGoalIndex", "actionIndex"])
    .index("by_user", ["userId"])
    .index("by_agent_status", ["assignedAgentName", "status"]),

  // ── OKRs ───────────────────────────────────────────────────────
  objectives: defineTable({
    userId: v.id("users"),
    title: v.string(),
    quarter: v.string(),            // "Q2-2026"
    progress: v.number(),           // 0–100, auto-calculated from KRs
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_quarter", ["userId", "quarter"]),

  keyResults: defineTable({
    objectiveId: v.id("objectives"),
    title: v.string(),
    // NEW: tracking type — not everything has a numeric target
    trackingType: v.union(
      v.literal("numeric"),         // target/current value, auto or manual
      v.literal("linear"),          // progress from Linear project task completion
      v.literal("manual"),          // Ahmed marks complete when ready
    ),
    targetValue: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    progress: v.number(),           // 0–100
    linearProjectId: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // NEW: Harada traceability
    haradaChartId: v.optional(v.id("haradaCharts")),
    haradaSubGoalIndex: v.optional(v.number()),
    haradaActionIndex: v.optional(v.number()),
  }).index("by_objective", ["objectiveId"]),

  // ── Habits ─────────────────────────────────────────────────────
  habits: defineTable({
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("custom"),
    ),
    customDays: v.optional(v.array(v.number())), // 0=Sun, 1=Mon, etc.
    currentStreak: v.number(),
    longestStreak: v.number(),
    freezesUsed: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    // NEW: Harada link (optional — existing habits unaffected)
    haradaChartId: v.optional(v.id("haradaCharts")),
    haradaSubGoalIndex: v.optional(v.number()),  // 0–7
    promotedFromActionIndex: v.optional(v.number()), // 0–7
  }).index("by_user", ["userId"]),

  habitCompletions: defineTable({
    habitId: v.id("habits"),
    date: v.string(),               // "2026-03-03"
    completedAt: v.number(),
  }).index("by_habit_date", ["habitId", "date"]),

  // ── Pomodoro ───────────────────────────────────────────────────
  // NEW: Focus session tracking
  pomodoroSessions: defineTable({
    userId: v.id("users"),
    // Optional task link
    taskId: v.optional(v.id("haradaTasks")),
    chartId: v.optional(v.id("haradaCharts")),
    subGoalIndex: v.optional(v.number()),
    actionIndex: v.optional(v.number()),
    // Session details
    label: v.string(),              // what Ahmed typed he's working on
    plannedDurationMinutes: v.number(), // default 25
    actualDurationMinutes: v.optional(v.number()), // set on completion
    breakDurationMinutes: v.number(),   // default 5
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    interrupted: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "startedAt"]),

  // ── Agent Infrastructure ────────────────────────────────────────
  agentActivity: defineTable({
    agentName: v.string(),
    action: v.string(),
    issueId: v.string(),
    issueTitle: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  agentMessages: defineTable({
    userId: v.id("users"),
    agentName: v.string(),
    direction: v.union(v.literal("outbound"), v.literal("inbound")),
    content: v.string(),
    timestamp: v.number(),
    read: v.boolean(),
    delivered: v.optional(v.boolean()),
    // NEW: optional task context (message relates to a specific task)
    relatedTaskId: v.optional(v.id("haradaTasks")),
  }).index("by_agent", ["agentName", "timestamp"]),

  agents: defineTable({
    agentId: v.string(),
    name: v.string(),
    codename: v.string(),
    emoji: v.string(),
    role: v.string(),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("offline")),
    currentTask: v.optional(v.string()),
    lastSeen: v.number(),
  }).index("by_agentId", ["agentId"]),

  briefings: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("morning"), v.literal("evening")),
    date: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_date", ["date", "type"]),

  linearCache: defineTable({
    projectId: v.string(),
    totalTasks: v.number(),
    completedTasks: v.number(),
    inProgressTasks: v.number(),
    blockedTasks: v.number(),
    lastSynced: v.number(),
  }).index("by_project", ["projectId"]),

});
```

---

## 6. New Convex Functions (v2.1 additions)

### Harada

| Function | Type | Purpose |
|----------|------|---------|
| `harada.setActive` | mutation | Set one chart as active, deactivate others |
| `harada.toggleActionDone` | mutation | Toggle done state; if all tasks done, auto-marks |
| `harada.getWithProgress` | query | Chart + computed stats (filled %, done %) |
| `harada.autoCompleteAction` | mutation | Called when linked KR hits 100% |

### Tasks

| Function | Type | Purpose |
|----------|------|---------|
| `haradaTasks.listForAction` | query | All tasks for a specific action cell |
| `haradaTasks.create` | mutation | Create a new sub-task |
| `haradaTasks.update` | mutation | Update title, notes, status, tracking type |
| `haradaTasks.delete` | mutation | Delete (soft-delete) |
| `haradaTasks.sendToAgent` | action | Send flesh-out or execute request to agent via OpenClaw |
| `haradaTasks.receiveFleshOut` | mutation | Called by agent HTTP endpoint when plan is ready |
| `haradaTasks.approve` | mutation | Ahmed approves plan → triggers execute notification to agent |
| `haradaTasks.markDone` | mutation | Mark complete; check if parent action should auto-complete |
| `haradaTasks.listPendingReview` | query | All tasks in `pending_review` state (for notification badge) |

### OKRs

| Function | Type | Purpose |
|----------|------|---------|
| `keyResults.updateProgress` | mutation | Update progress + trigger auto-complete Harada action if 100% |
| `keyResults.createFromHarada` | mutation | Create KR pre-linked to a Harada action |

### Habits

| Function | Type | Purpose |
|----------|------|---------|
| `habits.createFromHarada` | mutation | Create habit pre-linked to a Harada action/sub-goal |
| `habits.listWithContext` | query | Habits + resolved sub-goal label for dashboard |

### Pomodoro

| Function | Type | Purpose |
|----------|------|---------|
| `pomodoro.startSession` | mutation | Create session record when timer starts |
| `pomodoro.completeSession` | mutation | Update with actual duration, set completedAt |
| `pomodoro.interruptSession` | mutation | Mark interrupted, log actual duration |
| `pomodoro.todayStats` | query | Session count + total minutes for today |
| `pomodoro.historyForAction` | query | All pomodoro sessions linked to a specific action |

### Dashboard

| Function | Type | Purpose |
|----------|------|---------|
| `dashboard.getSummary` | query | Single aggregated response for home screen |

**`dashboard.getSummary` response shape:**
```typescript
{
  harada: {
    activeChart: { id, title, mainGoal } | null,
    actionsFilledCount: number,      // cells with text
    actionsDoneCount: number,        // cells marked done
    pendingReviewCount: number,      // tasks awaiting Ahmed's review
    totalActions: 64,
  },
  habits: {
    todayHabits: Array<{
      id, name, emoji, streak,
      completedToday: boolean,
      subGoalLabel: string | null,   // resolved label, e.g. "Business"
    }>,
    doneCount: number,
    totalCount: number,
  },
  okrs: {
    currentQuarter: string,
    overallProgress: number,
    objectives: Array<{ id, title, progress }>,
  },
  focus: {
    activeSession: PomodoroSession | null,
    todaySessions: number,
    todayMinutes: number,
  },
  agents: Array<{ agentName, status, currentTask }>,
  blockers: number,
}
```

---

## 7. Agent Delegation — Technical Flow

### Flesh-Out Flow

```
Ahmed taps [Send to Agent: Blueprint] for flesh-out
   │
   ▼
haradaTasks.sendToAgent (Convex action)
   → Sets status: "fleshing_out"
   → Calls OpenClaw API: POST /api/sessions/{blueprintSessionKey}/send
     Body: structured prompt with full context
   │
   ▼
Blueprint (agent) receives message, writes plan
   → Calls: POST /api/pulse/tasks/{taskId}/flesh-out
     (Convex HTTP endpoint)
     Body: { plan: "markdown plan content", agentName: "blueprint" }
   │
   ▼
haradaTasks.receiveFleshOut (Convex mutation)
   → Sets: fleshOutPlan, fleshOutAt
   → Sets status: "pending_review"
   → Triggers push notification to Ahmed
   │
   ▼
Ahmed opens Pulse → sees notification badge on Vision tab
   → Navigates to task → reads plan
   → Taps [Approve & Execute] or [Request Changes]
```

### Execute Flow (post-approval)
```
Ahmed taps [Approve & Execute]
   │
   ▼
haradaTasks.approve (Convex mutation)
   → Sets: approvedAt, status: "approved"
   → haradaTasks.sendToAgent called again with execute prompt
   → Agent receives: "Ahmed approved. Execute the plan."
   │
   ▼
Agent executes → sends periodic updates via POST /api/pulse/tasks/{taskId}/update
   → Sets status: "executing", optional progress notes
   │
   ▼
Agent finishes → POST /api/pulse/tasks/{taskId}/complete
   → Sets: executionNotes, completedAt, status: "done"
   → Checks: if all tasks under action are done → auto-mark action done
   → Push notification to Ahmed
```

### HTTP Endpoints Required (Convex `http.ts`)

| Method | Path | Handler | Called by |
|--------|------|---------|-----------|
| POST | `/pulse/tasks/:taskId/flesh-out` | `receiveFleshOut` | Agents |
| POST | `/pulse/tasks/:taskId/update` | `receiveTaskUpdate` | Agents |
| POST | `/pulse/tasks/:taskId/complete` | `receiveTaskComplete` | Agents |
| POST | `/pulse/message` | `receiveAgentMessage` | Agents (existing) |
| POST | `/pulse/agents/status` | `updateAgentStatus` | Agents (existing) |

All endpoints require a shared secret header: `X-Pulse-Secret: {env.PULSE_AGENT_SECRET}`

---

## 8. Pomodoro — UX Flow Detail

```
Launch Pomodoro (any entry point)
   │
   ├── From action/task: pre-filled label + task linked
   └── From FAB/dashboard: blank label field (required before starting)

Timer running:
   - Background timer (continues if app backgrounded)
   - Home screen shows live countdown in Section C
   - Lock screen notification: "[Task name] — 18:30 remaining"
   - Haptic every 5 min (optional, setting)

Timer ends:
   → Haptic burst + sound
   → "Session complete! ✓"
   → If task linked: "Mark [Task] as done?" → Yes/No
   → "Start 5-min break?" → Yes/Later
   → Session logged to pomodoroSessions

Break ends:
   → "Break over. Start another session?" → Yes/Done for now

Session abandoned (Stop tapped early):
   → "Stop session? Your progress still counts." → Confirm
   → Logs as interrupted with actual_duration
```

---

## 9. KR Auto-Complete — Harada Propagation

When a Key Result reaches 100% progress:

```
keyResults.updateProgress called with progress = 100
   │
   ▼
Check: has haradaChartId + haradaActionIndex?
   │
   ├── Yes → harada.autoCompleteAction(chartId, subGoalIndex, actionIndex)
   │     → Sets actionsDone[subGoalIndex][actionIndex] = true
   │     → Checks: are all 8 actions in this sub-goal done?
   │           → Yes → trigger sub-goal completion celebration
   │     → Checks: are all 64 actions done?
   │           → Yes → trigger full mandala celebration
   │
   └── No → no Harada update, just update KR normally
```

---

## 10. Screen Flow (Updated)

```
HOME DASHBOARD
│
├── [Vision Ring tap] → VISION TAB
│     ├── Chart List
│     │     ├── [Tap chart] → Mandala Overview
│     │     │     └── [Tap sub-goal block] → Sub-Goal Drill-Down
│     │     │           ├── [Tap action row] → Action Detail
│     │     │           │     ├── Tracking type: manual / linear / agent
│     │     │           │     ├── Sub-task list
│     │     │           │     │     └── [Tap sub-task] → Sub-Task / Delegation Detail
│     │     │           │     │           ├── State: Todo → assign agent
│     │     │           │     │           ├── State: Pending Review → read plan + approve
│     │     │           │     │           └── State: Done → view completion
│     │     │           │     ├── [Promote to Habit] → Habit creation sheet
│     │     │           │     ├── [Promote to KR] → KR creation sheet
│     │     │           │     └── [🍅 Focus on this] → Pomodoro (pre-linked)
│     │     │           └── ← → navigate sub-goals
│     │     └── [FAB] → New Chart
│     └── Notification badge: pending review count
│
├── [Habit tap] → Complete (1 tap)
│     └── [Long-press] → Habit Detail → shows sub-goal context
│
├── [OKR section tap] → OKRs TAB
│     └── KR detail → Harada trace tag
│
├── [Focus card tap] → Pomodoro Screen
│     └── Timer running / idle / today stats
│
└── [Agent avatar tap] → TEAM TAB
      └── Agent chat (delegation messages appear here too)
```

---

## 11. Build Phases (v2.1)

### Phase A — Connection Layer (1 week)
*Connects Harada, Habits, OKRs. Makes the system feel like one.*

- [ ] Schema: add `actionsDone`, `isActive` to haradaCharts; add `haradaChartId/SubGoalIndex` to habits; add `haradaChartId/SubGoalIndex/ActionIndex` and `trackingType` to keyResults; add `activeHaradaChartId` to users
- [ ] `harada.setActive` + active badge on chart list
- [ ] `harada.toggleActionDone` mutation
- [ ] Sub-goal drill-down screen (Screen C above)
- [ ] Action detail screen — tracking type selector, promote flows (Screen D above)
- [ ] Promote-to-Habit: bottom sheet + `habits.createFromHarada`
- [ ] Promote-to-KR: bottom sheet + `keyResults.createFromHarada`
- [ ] Habit cards: subtle sub-goal label
- [ ] KR: `trackingType` field + "manual" support (remove assumption of numeric target)
- [ ] KR → Harada auto-complete: `autoCompleteAction` on KR reaching 100%

**Acceptance criteria:**
- Ahmed can tap Harada action → "Make this a Habit" → habit in Habits tab with sub-goal tag
- Habit card shows muted sub-goal label only if linked
- Manual KR can be marked done without numeric value
- KR reaches 100% → linked Harada action auto-marks done
- One chart can be "active" at a time; active chart drives dashboard ring

### Phase B — Sub-Tasks & Agent Delegation (1.5 weeks)
*The work breakdown and agent workflow — the intelligence layer.*

- [ ] `haradaTasks` schema + all CRUD functions
- [ ] Sub-task list in Action Detail screen (Screen D)
- [ ] Sub-Task Detail / Delegation screen (Screen E) — all 5 states
- [ ] `haradaTasks.sendToAgent` Convex action (calls OpenClaw API)
- [ ] HTTP endpoints in `convex/http.ts`: flesh-out, update, complete
- [ ] Push notification when task enters `pending_review`
- [ ] Notification badge on Vision tab for pending reviews
- [ ] Task auto-completes action when all sub-tasks done

**Acceptance criteria:**
- Ahmed can break an action into sub-tasks from the Action Detail screen
- Ahmed can assign a sub-task to an agent for flesh-out
- Agent completes plan → Ahmed receives push notification
- Ahmed can read plan in-app, approve or request changes
- On approval → agent receives execute instruction
- Agent marks done → Ahmed sees completion, action auto-marks done if all tasks complete
- All task states render correctly (5 states, correct transitions)

### Phase C — Pomodoro Timer (1 week)
*Daily focus feature — makes Pulse the daily driver.*

- [ ] `pomodoroSessions` schema + all functions
- [ ] Pomodoro screen (full timer UI)
- [ ] Background timer (persists if app backgrounded)
- [ ] Lock screen notification with countdown
- [ ] Home dashboard Section C: live pomodoro card / idle state
- [ ] Today's stats (sessions + minutes)
- [ ] Session settings (duration, break, auto-start break)
- [ ] Integration: launch from action/task (pre-link session)
- [ ] Milestone haptic every 5 min (toggleable)
- [ ] "Mark task done?" prompt on session complete

**Acceptance criteria:**
- Timer runs accurately in background
- Lock screen shows remaining time
- Session is logged with correct duration (even if interrupted)
- Launching from a task pre-fills label and links session
- Today's session count and minutes visible on dashboard

### Phase D — Dashboard Redesign (1 week)
*The unified command center. Everything connected in one view.*

- [ ] `dashboard.getSummary` Convex query (single aggregated response)
- [ ] New Home screen layout (Sections A–H as specced above)
- [ ] Vision ring (two-ring: filled vs done) with animation
- [ ] Habit chips row with sub-goal tags
- [ ] Greeting line: "Toward: [Main Goal]"
- [ ] OKR compact summary section
- [ ] Agent status row
- [ ] Blockers banner (conditional)
- [ ] Quick Actions FAB (4 options)
- [ ] Pending review badge on Vision tab icon

**Acceptance criteria:**
- Dashboard loads in a single query, no waterfalls
- Vision ring shows correct % (actions done / 64)
- Every linked habit shows its sub-goal label
- Pending review count visible as badge
- Live pomodoro countdown shows in Section C if session running
- All taps navigate to correct destinations

### Phase E — Polish (3–4 days)
*The difference between good and daily driver.*

- [ ] Contextual empty states (all tabs + sub-screens)
- [ ] Streak milestone celebrations with sub-goal copy
- [ ] Sub-goal completion celebration (all 8 actions done)
- [ ] Sub-goal navigation arrows (← →) in drill-down
- [ ] Action Detail: time spent (sum of linked pomodoro sessions)
- [ ] Habit detail: Harada trace context + link to drill-down
- [ ] Smooth slide transition: mandala → drill-down
- [ ] Tab icon badge for pending agent reviews
- [ ] Agent chat: task context card when message relates to a task

---

## 12. What Doesn't Change

Preserve everything Tarek built:

- Auth flow (login, session management)
- Mandala chart rendering (keep current 9x9 grid — only adding drill-down on top)
- Habits CRUD (add/edit/delete/frequency) — only adding optional link fields
- Linear sync and timeline screen
- Agent feed (agentActivity stream)
- Briefings screen
- Convex real-time subscriptions pattern

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `actionsDone` migration on existing charts | Low | Lazy migration: treat undefined as all-false, patch on first update |
| Agent delegation latency (Ahmed waits for flesh-out) | Medium | Set expectation in UI: "Blueprint is working on this…" + estimated time |
| Pomodoro background timer accuracy on iOS | Medium | Use `expo-background-fetch` + local notification as fallback timer |
| Dashboard query performance as data grows | Medium | Denormalize counters (e.g., store `actionsDoneCount` on chart directly); revisit if >1000 tasks |
| Too many "pending review" notifications | Low | Batch notifications if multiple tasks complete close together; max 1 per agent per hour |
| Sub-task list grows too long under one action | Low | Show max 5, "show all" toggle; encourage breaking actions into smaller actions instead |
| KR auto-completing Harada without Ahmed seeing it | Low | Show confirmation toast: "Vision updated: [Action] marked done ✓" |

---

## 14. Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| One active Harada chart or multiple? | **One active at a time.** Others archived/accessible. |
| Auto-complete Harada action when KR hits 100%? | **Yes.** Auto-complete with toast confirmation. |
| Tab rename? | **Approved.** Home / Vision / OKRs / Habits / Team |
| Habit "why" label visibility | **Subtle.** Muted text, not prominent. Only show if habit is linked. |

---

*Spec written by Omar Selim (Blueprint) — Mantaray Digital*  
*v2.1 — Ahmed approved direction. Ready for Adam to assign build phases.*  
*Phase A and B can start in parallel if two builders available.*
