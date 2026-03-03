/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentActivity from "../agentActivity.js";
import type * as agentMessages from "../agentMessages.js";
import type * as agents from "../agents.js";
import type * as crons from "../crons.js";
import type * as habitCompletions from "../habitCompletions.js";
import type * as habits from "../habits.js";
import type * as harada from "../harada.js";
import type * as haradaTasks from "../haradaTasks.js";
import type * as http from "../http.js";
import type * as keyResults from "../keyResults.js";
import type * as linearSync from "../linearSync.js";
import type * as objectives from "../objectives.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentActivity: typeof agentActivity;
  agentMessages: typeof agentMessages;
  agents: typeof agents;
  crons: typeof crons;
  habitCompletions: typeof habitCompletions;
  habits: typeof habits;
  harada: typeof harada;
  haradaTasks: typeof haradaTasks;
  http: typeof http;
  keyResults: typeof keyResults;
  linearSync: typeof linearSync;
  objectives: typeof objectives;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
