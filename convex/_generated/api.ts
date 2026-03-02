// AUTO-GENERATED stub — replace with real generated file after `npx convex dev`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRef = (name: string): any => ({ _type: 'ref', name });

export const api = {
  users: {
    getUserByEmail: makeRef('users:getUserByEmail'),
    createUser: makeRef('users:createUser'),
    authenticateUser: makeRef('users:authenticateUser'),
  },
  habits: {
    listHabits: makeRef('habits:listHabits'),
    createHabit: makeRef('habits:createHabit'),
    completeHabit: makeRef('habits:completeHabit'),
  },
  habitCompletions: {
    getCompletionsForDate: makeRef('habitCompletions:getCompletionsForDate'),
    getCompletionsForHabit: makeRef('habitCompletions:getCompletionsForHabit'),
  },
  objectives: {
    listObjectives: makeRef('objectives:listObjectives'),
    createObjective: makeRef('objectives:createObjective'),
    updateObjectiveProgress: makeRef('objectives:updateObjectiveProgress'),
  },
  keyResults: {
    listKeyResults: makeRef('keyResults:listKeyResults'),
    createKeyResult: makeRef('keyResults:createKeyResult'),
    updateKeyResultManual: makeRef('keyResults:updateKeyResultManual'),
  },
  agentActivity: {
    listRecent: makeRef('agentActivity:listRecent'),
  },
  linearSync: {
    syncProjects: makeRef('linearSync:syncProjects'),
  },
} as const;
