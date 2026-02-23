/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly VITE_REDIS_URL: string
    readonly VITE_REDIS_TOKEN: string
    readonly VITE_SENTRY_DSN: string
    // add more env variables here...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
