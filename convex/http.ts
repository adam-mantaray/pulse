import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Agent writes inbound message to agentMessages
http.route({
  path: "/api/pulse/message",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agentName, content, userId } = body;

    if (!agentName || !content || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: agentName, content, userId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(internal.agentMessages.insertInbound, {
      userId,
      agentName,
      content,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Sync agents from OpenClaw
http.route({
  path: "/api/pulse/agents/sync",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agents } = body;

    if (!agents || !Array.isArray(agents)) {
      return new Response(
        JSON.stringify({ error: "Missing required field: agents (array)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(internal.agents.bulkSync, { agents });

    return new Response(
      JSON.stringify({ success: true, synced: agents.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Update agent status
http.route({
  path: "/api/pulse/agents/status",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agentId, status, currentTask } = body;

    if (!agentId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: agentId, status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.agents.updateStatus, {
      agentId,
      status,
      currentTask,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Health check
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: "ok", app: "pulse", timestamp: Date.now() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
