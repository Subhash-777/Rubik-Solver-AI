
// Augment the NodeJS namespace to include API_KEY in ProcessEnv.
// This avoids redeclaring the global 'process' variable which causes conflicts
// with standard TypeScript definitions (e.g., from @types/node) already present in the environment.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
