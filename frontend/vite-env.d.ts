// Source - https://stackoverflow.com/a/78706043
// Posted by Menial Orchestra
// Retrieved 2026-04-11, License - CC BY-SA 4.0

interface ImportMetaEnv {
  readonly VITE_YOUR_URL: string;
  readonly VITE_REALM: string;
  readonly VITE_CLIENT_ID: string;
 
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
