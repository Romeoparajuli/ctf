import { USE_MOCK_API } from "./config";
import { ctfdApi } from "./ctfdApi";
import { mockApi } from "./mockApi";
import { RegistrationApi } from "./types";

export const registrationApi: RegistrationApi = USE_MOCK_API ? mockApi : ctfdApi;

export * from "./types";
export * from "./config";
