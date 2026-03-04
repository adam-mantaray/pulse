import { usePostHog } from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';

// Module-level client reference (set by provider)
let _client: ReturnType<typeof usePostHog> | null = null;

export function setAnalyticsClient(client: ReturnType<typeof usePostHog>) {
  _client = client;
}

export const EVENTS = {
  DASHBOARD_VIEWED: 'dashboard_viewed',
  HABIT_TRACKED: 'habit_tracked',
  STREAK_MILESTONE: 'streak_milestone',
  CHECK_IN_COMPLETED: 'check_in_completed',
  POMODORO_STARTED: 'pomodoro_started',
  POMODORO_COMPLETED: 'pomodoro_completed',
  AGENT_MESSAGE_SENT: 'agent_message_sent',
  AGENT_MESSAGE_RECEIVED: 'agent_message_received',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  SETTINGS_CHANGED: 'settings_changed',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

export const analytics = {
  capture(event: string, properties?: PostHogEventProperties) {
    _client?.capture(event, properties);
  },
  identify(userId: string, traits?: PostHogEventProperties) {
    _client?.identify(userId, traits);
  },
  reset() {
    _client?.reset();
  },
};
