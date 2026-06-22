/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Back-end API base URL. FE는 BE API만 호출한다. */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
