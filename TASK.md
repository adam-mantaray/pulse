# Pulse: Task Batch

Do both tasks in order. Commit after each.

---

## TASK 1 — Sprint card: real Linear data

File: `app/(tabs)/index.tsx`

The sprint card currently shows static placeholder text. Replace with real data from `api.linearSync` or `api.agentActivity`.

### Step 1: Add a public query to `convex/linearSync.ts`

Add this at the bottom of the file:
```ts
export const getSprintSummary = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("linearCache").collect();
    const totalTasks = rows.reduce((s, r) => s + r.totalTasks, 0);
    const completedTasks = rows.reduce((s, r) => s + r.completedTasks, 0);
    const inProgressTasks = rows.reduce((s, r) => s + r.inProgressTasks, 0);
    const lastSynced = rows.length > 0 ? Math.max(...rows.map((r) => r.lastSynced)) : null;
    return { totalTasks, completedTasks, inProgressTasks, lastSynced, projectCount: rows.length };
  },
});
```
Make sure `query` is imported from `./_generated/server` at the top of the file.

### Step 2: Update `app/(tabs)/index.tsx`

1. Import `useQuery` from convex/react (it may already be imported as `useConvexQuery`)
2. Add this query call near the top of `DashboardScreen()`:
```ts
const sprintSummary = useConvexQuery(api.linearSync.getSprintSummary);
```

3. Replace the static sprint card text:
```tsx
// BEFORE:
<Text variant="subheading">Active Development</Text>
<Text variant="bodySmall">Syncs from Linear every 5 minutes</Text>

// AFTER:
<Text variant="subheading">
  {sprintSummary
    ? `${sprintSummary.completedTasks} / ${sprintSummary.totalTasks} tasks done`
    : 'Loading sprint...'}
</Text>
<Text variant="bodySmall">
  {sprintSummary
    ? `${sprintSummary.inProgressTasks} in progress · ${sprintSummary.projectCount} project${sprintSummary.projectCount !== 1 ? 's' : ''}`
    : 'Syncs from Linear every 5 minutes'}
</Text>
```

Commit: `"feat: MAN-sprint — sprint card shows real Linear data (completedTasks/totalTasks)"`

---

## TASK 2 — Error boundaries across the app

Add proper React error boundaries to prevent full app crashes.

### Step 1: Create `src/components/ErrorBoundary.tsx`

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  label?: string; // for debugging — e.g. "HabitList"
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error.message, info);
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={2}>
            {this.state.error?.message ?? 'Unknown error'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    margin: 8,
  },
  emoji: { fontSize: 28, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#ef4444', marginBottom: 4 },
  message: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 12 },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8,
  },
  buttonText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
});

/** Convenience wrapper for inline use */
export function Section({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return <ErrorBoundary label={label}>{children}</ErrorBoundary>;
}
```

### Step 2: Wrap key sections in `app/(tabs)/index.tsx`

Import `ErrorBoundary` and `Section` from `../../src/components/ErrorBoundary`.

Wrap each major section of the dashboard in a `<Section label="...">`:
- The GoalRing section: `<Section label="GoalRing">...</Section>`
- The Habits section: `<Section label="Habits">...</Section>`
- The Sprint Card section: `<Section label="SprintCard">...</Section>`
- The Agent Team section: `<Section label="AgentTeam">...</Section>`

Don't wrap the whole ScrollView — wrap individual sections so one crash doesn't kill the whole screen.

### Step 3: Wrap the root layout

In `app/_layout.tsx` (or the app entry file), find the root return and wrap in `<ErrorBoundary label="Root">`:

```tsx
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// In the return:
return (
  <ErrorBoundary label="Root">
    {/* existing providers */}
  </ErrorBoundary>
);
```

### Step 4: Add loading/error guards to key screens

In `app/(tabs)/index.tsx`, the existing data queries return `undefined` while loading. Add a simple guard at the top of the render (after all hooks):

```tsx
// Already handled by ErrorBoundary — just add null coalescing on queries
// e.g. (habits ?? []) instead of habits.map(...)
// (registeredAgents ?? []) instead of registeredAgents.map(...)
```

Scan the file for any `.map()` or property access on query results that doesn't have a `?? []` or optional chain guard, and add them.

Commit: `"fix: MAN-f0293993 — add ErrorBoundary component, wrap dashboard sections, root layout guard"`

---

## After both tasks:
1. Deploy Convex: `npx convex deploy --yes`
2. Commit and push: `git add -A && git commit -m "build: deploy sprint summary query" && git push`
3. `openclaw system event --text "Done: Pulse sprint card real data + error boundaries added" --mode now`
