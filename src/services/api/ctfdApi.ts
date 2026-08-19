import { ctfdRequest } from "./httpClient";
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
 * Real CTFd adapter. Implements the same RegistrationApi contract as
 * mockApi.ts so the rest of the app never branches on which one is active
 * (see ./index.ts).
 *
 * Endpoint shapes below follow CTFd's documented conventions:
 *  - POST /api/v1/register            — create the participant's user account
 *  - GET  /api/v1/teams/fields        — custom team fields (mirrors the
 *                                        documented /api/v1/users/fields)
 *  - POST /api/v1/teams               — create a team (Teams Mode only)
 *  - POST /teams/join                 — CTFd's own non-versioned join route;
 *                                        the tutorial docs confirm the
 *                                        "team name + shared password" flow
 *                                        but not its exact JSON contract, so
 *                                        verify this against the target
 *                                        instance before relying on it.
 */

interface CtfdUser {
  id: number;
  name: string;
  email: string;
}

interface CtfdTeam {
  id: number;
  name: string;
  members?: number[];
}

interface CtfdFieldDef {
  id: number;
  name: string;
  type: "text";
  required: boolean;
  field_type?: string;
  description?: string;
}

async function registerAccount(account: AccountInput): Promise<CtfdUser> {
  return ctfdRequest<CtfdUser>("POST", "/api/v1/register", {
    name: account.name,
    email: account.email,
    password: account.password,
  });
}

function toTeam(raw: CtfdTeam, maxSize: number): Team {
  return {
    id: raw.id,
    name: raw.name,
    memberCount: raw.members?.length ?? 1,
    maxSize,
  };
}

export const ctfdApi: RegistrationApi = {
  async getTeamFields(): Promise<CustomField[]> {
    try {
      const fields = await ctfdRequest<CtfdFieldDef[]>("GET", "/api/v1/teams/fields");
      return fields.map((f) => ({
        id: String(f.id),
        name: f.name,
        type: "text",
        required: f.required,
        helperText: f.description,
      }));
    } catch {
      // Custom fields are optional; don't block registration if unavailable.
      return [];
    }
  },

  async createAccountAndTeam(account, team: CreateTeamInput): Promise<RegisteredSession> {
    const user = await registerAccount(account);

    try {
      const fields = team.customFields
        ? Object.entries(team.customFields).map(([field_id, value]) => ({
            field_id: Number(field_id),
            value,
          }))
        : undefined;

      const created = await ctfdRequest<CtfdTeam>("POST", "/api/v1/teams", {
        name: team.teamName,
        password: team.password,
        fields,
      });

      return { user, team: toTeam(created, 4) };
    } catch (err) {
      if (err instanceof RegistrationApiError) {
        throw new RegistrationApiError({
          ...err.details,
          formError:
            err.details.formError ??
            "Your account was created, but the team couldn't be set up. Contact an organizer for help finishing setup.",
        });
      }
      throw err;
    }
  },

  async createAccountAndJoinTeam(account, join: JoinTeamInput): Promise<RegisteredSession> {
    const user = await registerAccount(account);

    try {
      const joined = await ctfdRequest<CtfdTeam>("POST", "/teams/join", {
        name: join.teamName,
        password: join.password,
      });

      return { user, team: toTeam(joined, 4) };
    } catch (err) {
      if (err instanceof RegistrationApiError) {
        throw new RegistrationApiError({
          ...err.details,
          formError:
            err.details.formError ??
            "Your account was created, but joining the team failed. Contact an organizer for help finishing setup.",
        });
      }
      throw err;
    }
  },
};
