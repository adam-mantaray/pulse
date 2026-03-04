# Pulse: MAN-104 + MAN-112

Do both tasks in order. Commit after each.

---

## TASK 1 — MAN-104: Fix N+1 query in listConversations

File: convex/agentMessages.ts

Current: `listConversations` loops over each agent with a separate DB query per agent (N+1 pattern).

Fix: Replace the per-agent loop with a single bulk query + JS grouping:

```ts
export const listConversations = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    // 1 query: all registered agents for this board
    const registeredAgents = await ctx.db
      .query("registeredAgents")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    const agentIds = registeredAgents.map((a) => a.agentId);

    // 1 query: all messages for this board (or use index if available)
    const allMessages = await ctx.db
      .query("agentMessages")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    // JS grouping: last message per agent
    const lastMessageByAgent: Record<string, typeof allMessages[0]> = {};
    for (const msg of allMessages) {
      const existing = lastMessageByAgent[msg.agentId];
      if (!existing || msg._creationTime > existing._creationTime) {
        lastMessageByAgent[msg.agentId] = msg;
      }
    }

    return agentIds.map((agentId) => ({
      agentId,
      lastMessage: lastMessageByAgent[agentId] ?? null,
    }));
  },
});
```

IMPORTANT: Check the actual index names and field names in convex/schema.ts before writing the code — use the correct index names. If the index structure is different, adjust accordingly. The key requirement is: reduce from N+1 queries to 2 queries max.

Commit: "perf: MAN-104 — fix N+1 in listConversations, 2 queries instead of N+1"

---

## TASK 2 — MAN-112: Cascade delete haradaTasks on harada.remove

File: convex/harada.ts

Find the `remove` mutation (it deletes a haradaChart). Before deleting the chart, also delete all haradaTasks with matching chartId.

Check the schema for the correct index name on haradaTasks (likely "by_chart" or "by_chart_action" on chartId field).

Add before `ctx.db.delete(args.chartId)`:
```ts
// Cascade delete all tasks for this chart
const tasks = await ctx.db
  .query("haradaTasks")
  .withIndex("by_chart_action", (q) => q.eq("chartId", args.chartId))
  .collect();
for (const task of tasks) {
  await ctx.db.delete(task._id);
}
```

Adjust index name to match what's in schema.ts.

Commit: "fix: MAN-112 — cascade delete haradaTasks when chart is removed"

---

## After both tasks:
1. npx convex deploy --yes
2. git push
3. openclaw system event --text "Done: Pulse MAN-104 N+1 fix + MAN-112 cascade delete deployed" --mode now
