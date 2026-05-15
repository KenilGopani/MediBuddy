/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_matchTrials from "../actions/matchTrials.js";
import type * as actions_summarize from "../actions/summarize.js";
import type * as actions_transcribeAudio from "../actions/transcribeAudio.js";
import type * as appointments from "../appointments.js";
import type * as consent from "../consent.js";
import type * as summaries from "../summaries.js";
import type * as transcripts from "../transcripts.js";
import type * as trialMatches from "../trialMatches.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/matchTrials": typeof actions_matchTrials;
  "actions/summarize": typeof actions_summarize;
  "actions/transcribeAudio": typeof actions_transcribeAudio;
  appointments: typeof appointments;
  consent: typeof consent;
  summaries: typeof summaries;
  transcripts: typeof transcripts;
  trialMatches: typeof trialMatches;
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
