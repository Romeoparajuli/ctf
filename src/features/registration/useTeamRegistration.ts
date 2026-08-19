import { useCallback, useEffect, useState } from "react";
import {
  AccountInput,
  CreateTeamInput,
  CustomField,
  JoinTeamInput,
  RegisteredSession,
  registrationApi,
  RegistrationApiError,
} from "../../services/api";
import { FieldErrors } from "./validation";

export type SubmissionStatus = "idle" | "submitting" | "success" | "error";

interface RegistrationState {
  status: SubmissionStatus;
  fieldErrors: FieldErrors;
  formError?: string;
  result?: RegisteredSession;
}

const IDLE_STATE: RegistrationState = { status: "idle", fieldErrors: {} };

/**
 * The one place UI components talk to the registration API. Screens never
 * call registrationApi directly or interpret CTFd's raw error shape — they
 * hand this hook form values and render whatever state it produces.
 */
export function useTeamRegistration() {
  const [state, setState] = useState<RegistrationState>(IDLE_STATE);
  const [teamFields, setTeamFields] = useState<CustomField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    registrationApi
      .getTeamFields()
      .then((fields) => {
        if (!cancelled) setTeamFields(fields);
      })
      .finally(() => {
        if (!cancelled) setFieldsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = useCallback(() => setState(IDLE_STATE), []);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof RegistrationApiError) {
      setState({
        status: "error",
        fieldErrors: err.details.fieldErrors ?? {},
        formError:
          err.details.formError ??
          (err.details.fieldErrors ? undefined : "Something went wrong. Please try again."),
      });
      return;
    }
    setState({
      status: "error",
      fieldErrors: {},
      formError: "Something unexpected happened. Please try again.",
    });
  }, []);

  const createTeam = useCallback(
    async (account: AccountInput, team: CreateTeamInput) => {
      setState({ status: "submitting", fieldErrors: {} });
      try {
        const result = await registrationApi.createAccountAndTeam(account, team);
        setState({ status: "success", fieldErrors: {}, result });
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const joinTeam = useCallback(
    async (account: AccountInput, join: JoinTeamInput) => {
      setState({ status: "submitting", fieldErrors: {} });
      try {
        const result = await registrationApi.createAccountAndJoinTeam(account, join);
        setState({ status: "success", fieldErrors: {}, result });
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  return {
    ...state,
    teamFields,
    fieldsLoading,
    isSubmitting: state.status === "submitting",
    createTeam,
    joinTeam,
    reset,
  };
}
