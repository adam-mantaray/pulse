import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

function verifyWebhookSecret(request: Request): Response | null {
  const secret = process.env.PULSE_WEBHOOK_SECRET;
  if (!secret) return null; // not configured — skip check in dev
  const provided = request.headers.get("x-webhook-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

const http = httpRouter();

// Agent writes inbound message to agentMessages
http.route({
  path: "/api/pulse/message",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authError = verifyWebhookSecret(request);
    if (authError) return authError;

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
    const authError = verifyWebhookSecret(request);
    if (authError) return authError;

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
    const authError = verifyWebhookSecret(request);
    if (authError) return authError;

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

// Poll outbound messages (OpenClaw bridge picks these up)
http.route({
  path: "/api/pulse/messages/poll",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const authError = verifyWebhookSecret(request);
    if (authError) return authError;

    const messages = await ctx.runQuery(api.agentMessages.pollOutbound, {});

    return new Response(
      JSON.stringify({ messages }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Mark outbound messages as delivered
http.route({
  path: "/api/pulse/messages/ack",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authError = verifyWebhookSecret(request);
    if (authError) return authError;

    const body = await request.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return new Response(
        JSON.stringify({ error: "Missing required field: messageIds (array)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.agentMessages.markDelivered, { messageIds });

    return new Response(
      JSON.stringify({ success: true, acknowledged: messageIds.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// ── Agent task callbacks ─────────────────────────────────────────────

function verifyAgentSecret(request: Request): Response | null {
  const secret = process.env.PULSE_AGENT_SECRET;
  if (!secret) return null; // not configured — skip check in dev
  const provided = request.headers.get("x-pulse-secret");
  if (provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

// Agent submits flesh-out plan
http.route({
  path: "/api/pulse/tasks/flesh-out",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authError = verifyAgentSecret(request);
    if (authError) return authError;

    const body = await request.json();
    const { taskId, plan, agentName } = body;

    if (!taskId || !plan || !agentName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: taskId, plan, agentName" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(internal.haradaTasks.receiveFleshOut, { taskId, plan, agentName });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Agent marks task complete
http.route({
  path: "/api/pulse/tasks/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authError = verifyAgentSecret(request);
    if (authError) return authError;

    const body = await request.json();
    const { taskId, notes, agentName } = body;

    if (!taskId || !notes || !agentName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: taskId, notes, agentName" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(internal.haradaTasks.receiveComplete, { taskId, notes, agentName });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Agent sends progress update
http.route({
  path: "/api/pulse/tasks/update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authError = verifyAgentSecret(request);
    if (authError) return authError;

    const body = await request.json();
    const { taskId, notes } = body;

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: taskId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.haradaTasks.update, {
      taskId,
      executionNotes: notes,
      status: "executing",
    });

    return new Response(
      JSON.stringify({ ok: true }),
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
