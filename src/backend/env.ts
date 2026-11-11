/**
 * Lee las variables de entorno del backend y avisa con claridad
 * si falta alguna (en lugar de fallar con un error críptico).
 */

export type BackendEnv = {
  whatsappToken: string;
  whatsappPhoneId: string;
  whatsappVerifyToken: string;
  whatsappAppSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  googleServiceAccountEmail: string;
  googlePrivateKey: string;
  googleCalendarId: string;
};

export function getBackendEnv(): BackendEnv {
  const missing: string[] = [];
  const read = (name: string): string => {
    const value = process.env[name];
    if (!value) missing.push(name);
    return value ?? "";
  };

  const env: BackendEnv = {
    whatsappToken: read("WHATSAPP_TOKEN"),
    whatsappPhoneId: read("WHATSAPP_PHONE_ID"),
    whatsappVerifyToken: read("WHATSAPP_VERIFY_TOKEN"),
    whatsappAppSecret: read("WHATSAPP_APP_SECRET"),
    supabaseUrl: read("SUPABASE_URL"),
    supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
    googleServiceAccountEmail: read("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    googlePrivateKey: read("GOOGLE_PRIVATE_KEY"),
    googleCalendarId: read("GOOGLE_CALENDAR_ID"),
  };

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(", ")}. Copia .env.example a .env.local y rellénalas.`,
    );
  }

  // Vercel guarda el PEM con los saltos de línea escapados como \n
  env.googlePrivateKey = env.googlePrivateKey.replace(/\\n/g, "\n");

  return env;
}
