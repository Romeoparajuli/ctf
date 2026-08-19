/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CTFD_BASE_URL?: string;
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_EVENT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
