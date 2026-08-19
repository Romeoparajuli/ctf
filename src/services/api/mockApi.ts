import { TEAM_MAX_SIZE } from "./config";
import {
  AccountInput,
  CreateTeamInput,
  CustomField,
  JoinTeamInput,
  RegisteredSession,
  RegistrationApi,
  RegistrationApiError,
  Team,
} from "./types";

/**
 * In-memory stand-in for a real CTFd instance. Mirrors CTFd's actual
 * constraints (unique team name, unique email, team capacity, one team
 * per user) so the UI's error states are exercised realistically without
 * a live backend. Swapped out for ctfdApi.ts via VITE_USE_MOCK_API.
 *
 * Seeded with one existing team so the Join Team flow is demoable end to
 * end: name "CYBER PHANTOMS", password "letmein123".
 */

interface MockTeamRecord {
  id: number;
  name: string;
  password: string;
  memberEmails: string[];
}

const teams = new Map<string, MockTeamRecord>([
  [
    "cyber phantoms",
    { id: 1, name: "CYBER PHANTOMS", password: "letmein123", memberEmails: ["captain@example.com"] },
  ],
]);

const emails = new Set<string>(["captain@example.com"]);

let nextTeamId = 2;
let nextUserId = 2;

const CUSTOM_FIELDS: CustomField[] = [
  {
    id: "affiliation",
    name: "Affiliation / Organization",
    type: "text",
    required: false,
    helperText: "School, company, or \"Independent\" — shown on the scoreboard.",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitteredLatency() {
  return 500 + Math.random() * 500;
}

function assertAccountIsValid(account: AccountInput) {
  if (emails.has(account.email.toLowerCase())) {
    throw new RegistrationApiError({
      kind: "conflict",
      fieldErrors: {
        email: "This email is already registered and part of a team. Log in instead of registering again.",
      },
    });
  }
}

function toTeam(record: MockTeamRecord): Team {
  return {
    id: record.id,
    name: record.name,
    memberCount: record.memberEmails.length,
    maxSize: TEAM_MAX_SIZE,
  };
}

export const mockApi: RegistrationApi = {
  async getTeamFields(): Promise<CustomField[]> {
    await delay(200);
    return CUSTOM_FIELDS;
  },

  async createAccountAndTeam(account: AccountInput, team: CreateTeamInput): Promise<RegisteredSession> {
    await delay(jitteredLatency());

    assertAccountIsValid(account);

    const key = team.teamName.trim().toLowerCase();
    if (teams.has(key)) {
      throw new RegistrationApiError({
        kind: "conflict",
        fieldErrors: { teamName: "That team name is already taken. Try another." },
      });
    }

    const record: MockTeamRecord = {
      id: nextTeamId++,
      name: team.teamName.trim(),
      password: team.password,
      memberEmails: [account.email],
    };
    teams.set(key, record);
    emails.add(account.email.toLowerCase());

    return {
      user: { id: nextUserId++, name: account.name, email: account.email },
      team: toTeam(record),
    };
  },

  async createAccountAndJoinTeam(account: AccountInput, join: JoinTeamInput): Promise<RegisteredSession> {
    await delay(jitteredLatency());

    assertAccountIsValid(account);

    const key = join.teamName.trim().toLowerCase();
    const record = teams.get(key);

    if (!record) {
      throw new RegistrationApiError({
        kind: "not_found",
        fieldErrors: { teamName: "No team with that name exists. Check the spelling with your captain." },
      });
    }

    if (record.password !== join.password) {
      throw new RegistrationApiError({
        kind: "unauthorized",
        fieldErrors: { teamPassword: "Incorrect team password." },
      });
    }

    if (record.memberEmails.length >= TEAM_MAX_SIZE) {
      throw new RegistrationApiError({
        kind: "conflict",
        formError: `${record.name} is already full (max ${TEAM_MAX_SIZE} members). Ask your captain to start a new team.`,
      });
    }

    record.memberEmails.push(account.email);
    emails.add(account.email.toLowerCase());

    return {
      user: { id: nextUserId++, name: account.name, email: account.email },
      team: toTeam(record),
    };
  },
};
