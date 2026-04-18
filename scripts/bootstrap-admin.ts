import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

import type { Database } from "../src/types/database";

loadEnvConfig(process.cwd());

const DEFAULT_BOOTSTRAP_EMAIL = "admin@sms.local";
const DEFAULT_BOOTSTRAP_PASSWORD = "Admin@123456";
const DEFAULT_BOOTSTRAP_FULL_NAME = "System Admin";
const DEFAULT_BOOTSTRAP_MUST_CHANGE_PASSWORD = false;

const requiredEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const optionalEnvSchema = z.object({
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  ADMIN_BOOTSTRAP_FULL_NAME: z.string().min(1).optional(),
  ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD: z.string().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).optional(),
  ADMIN_BOOTSTRAP_PHONE: z.string().min(6).optional(),
});

type BootstrapEnv = {
  ADMIN_BOOTSTRAP_EMAIL?: string;
  ADMIN_BOOTSTRAP_FULL_NAME?: string;
  ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD?: string;
  ADMIN_BOOTSTRAP_PASSWORD?: string;
  ADMIN_BOOTSTRAP_PHONE?: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type CliArgs = {
  email: string;
  fullName: string;
  mustChangePassword: boolean;
  password: string;
  phone?: string;
};

type AuthUser = {
  email: string | null;
  id: string;
  user_metadata: Record<string, unknown> | null;
};

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    return undefined;
  }

  return value;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n"].includes(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid boolean value "${value}" for --must-change-password. Use true/false.`,
  );
}

function readEnv(): BootstrapEnv {
  let requiredEnv: z.infer<typeof requiredEnvSchema>;

  try {
    requiredEnv = requiredEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch {
    throw new Error(
      [
        "Thiếu biến môi trường Supabase để bootstrap admin.",
        "Cần tối thiểu:",
        "- NEXT_PUBLIC_SUPABASE_URL",
        "- SUPABASE_SERVICE_ROLE_KEY",
      ].join("\n"),
    );
  }

  const optionalEnv = optionalEnvSchema.parse({
    ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL,
    ADMIN_BOOTSTRAP_FULL_NAME: process.env.ADMIN_BOOTSTRAP_FULL_NAME,
    ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD: process.env.ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD,
    ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    ADMIN_BOOTSTRAP_PHONE: process.env.ADMIN_BOOTSTRAP_PHONE,
  });

  const resolvedEnv: BootstrapEnv = {
    NEXT_PUBLIC_SUPABASE_URL: requiredEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: requiredEnv.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (optionalEnv.ADMIN_BOOTSTRAP_EMAIL) {
    resolvedEnv.ADMIN_BOOTSTRAP_EMAIL = optionalEnv.ADMIN_BOOTSTRAP_EMAIL;
  }
  if (optionalEnv.ADMIN_BOOTSTRAP_FULL_NAME) {
    resolvedEnv.ADMIN_BOOTSTRAP_FULL_NAME = optionalEnv.ADMIN_BOOTSTRAP_FULL_NAME;
  }
  if (optionalEnv.ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD) {
    resolvedEnv.ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD =
      optionalEnv.ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD;
  }
  if (optionalEnv.ADMIN_BOOTSTRAP_PASSWORD) {
    resolvedEnv.ADMIN_BOOTSTRAP_PASSWORD = optionalEnv.ADMIN_BOOTSTRAP_PASSWORD;
  }
  if (optionalEnv.ADMIN_BOOTSTRAP_PHONE) {
    resolvedEnv.ADMIN_BOOTSTRAP_PHONE = optionalEnv.ADMIN_BOOTSTRAP_PHONE;
  }

  return resolvedEnv;
}

function buildDefaultArgsFromEnv(env: BootstrapEnv): CliArgs {
  return {
    email: (env.ADMIN_BOOTSTRAP_EMAIL ?? DEFAULT_BOOTSTRAP_EMAIL).trim().toLowerCase(),
    fullName: (env.ADMIN_BOOTSTRAP_FULL_NAME ?? DEFAULT_BOOTSTRAP_FULL_NAME).trim(),
    mustChangePassword: parseBoolean(
      env.ADMIN_BOOTSTRAP_MUST_CHANGE_PASSWORD,
      DEFAULT_BOOTSTRAP_MUST_CHANGE_PASSWORD,
    ),
    password: (env.ADMIN_BOOTSTRAP_PASSWORD ?? DEFAULT_BOOTSTRAP_PASSWORD).trim(),
    ...(env.ADMIN_BOOTSTRAP_PHONE ? { phone: env.ADMIN_BOOTSTRAP_PHONE.trim() } : {}),
  };
}

function showUsage() {
  console.info("Usage:");
  console.info(
    'npm run admin:bootstrap -- [--email admin@sms.local] [--password "Admin@123456"] [--full-name "System Admin"] [--phone 0900000000] [--must-change-password false]',
  );
  console.info("");
  console.info("Nếu không truyền tham số, script dùng default từ env hoặc fallback:");
  console.info(`- email: ${DEFAULT_BOOTSTRAP_EMAIL}`);
  console.info(`- password: ${DEFAULT_BOOTSTRAP_PASSWORD}`);
  console.info(`- full-name: ${DEFAULT_BOOTSTRAP_FULL_NAME}`);
}

function parseArgs(env: BootstrapEnv): CliArgs {
  if (hasFlag("--help") || hasFlag("-h")) {
    showUsage();
    process.exit(0);
  }

  const defaults = buildDefaultArgsFromEnv(env);

  const phone = readArg("--phone")?.trim() ?? defaults.phone;
  const parsed = z
    .object({
      email: z.string().email(),
      fullName: z.string().min(1),
      mustChangePassword: z.boolean(),
      password: z.string().min(8),
      phone: z.string().min(6).optional(),
    })
    .parse({
      email: (readArg("--email") ?? defaults.email).trim().toLowerCase(),
      fullName: (readArg("--full-name") ?? defaults.fullName).trim(),
      mustChangePassword: parseBoolean(
        readArg("--must-change-password"),
        defaults.mustChangePassword,
      ),
      password: (readArg("--password") ?? defaults.password).trim(),
      ...(phone ? { phone } : {}),
    });

  return {
    email: parsed.email,
    fullName: parsed.fullName,
    mustChangePassword: parsed.mustChangePassword,
    password: parsed.password,
    ...(parsed.phone ? { phone: parsed.phone } : {}),
  };
}

function createAdminClient(env: BootstrapEnv) {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

async function findAuthUserByEmail(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`Unable to lookup auth user: ${error.message}`);
    }

    const users = data.users ?? [];
    const matchedUser = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (matchedUser) {
      return {
        email: matchedUser.email ?? null,
        id: matchedUser.id,
        user_metadata:
          matchedUser.user_metadata &&
          typeof matchedUser.user_metadata === "object" &&
          !Array.isArray(matchedUser.user_metadata)
            ? (matchedUser.user_metadata as Record<string, unknown>)
            : null,
      };
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(
  admin: SupabaseClient<Database>,
  args: CliArgs,
) {
  const existingAuthUser = await findAuthUserByEmail(admin, args.email);

  if (!existingAuthUser) {
    const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
      email: args.email,
      email_confirm: true,
      password: args.password,
      user_metadata: {
        role: "ADMIN",
        source: "bootstrap-admin-script",
      },
      ...(args.phone ? { phone: args.phone } : {}),
    });

    if (authError || !createdUser.user) {
      throw new Error(authError?.message ?? "Unable to create auth user.");
    }

    return {
      mode: "created" as const,
      userId: createdUser.user.id,
    };
  }

  const { error: updateAuthError } = await admin.auth.admin.updateUserById(
    existingAuthUser.id,
    {
      email_confirm: true,
      password: args.password,
      user_metadata: {
        ...(existingAuthUser.user_metadata ?? {}),
        role: "ADMIN",
        source: "bootstrap-admin-script",
      },
    },
  );

  if (updateAuthError) {
    throw new Error(`Unable to update auth user: ${updateAuthError.message}`);
  }

  return {
    mode: "updated" as const,
    userId: existingAuthUser.id,
  };
}

async function ensureAdminProfile(
  admin: SupabaseClient<Database>,
  args: CliArgs,
  userId: string,
) {
  const { data: profileWithSameEmail, error: emailLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", args.email)
    .maybeSingle();

  if (emailLookupError) {
    throw new Error(`Unable to lookup profile by email: ${emailLookupError.message}`);
  }

  const normalizedProfileWithSameEmail = profileWithSameEmail as
    | { id: string }
    | null;

  if (
    normalizedProfileWithSameEmail &&
    normalizedProfileWithSameEmail.id !== userId
  ) {
    throw new Error(
      `Email ${args.email} is linked to another profile id ${normalizedProfileWithSameEmail.id}.`,
    );
  }

  const profilePayload: Record<string, unknown> = {
    email: args.email,
    full_name: args.fullName,
    id: userId,
    metadata: {
      source: "bootstrap-admin-script",
    },
    must_change_password: args.mustChangePassword,
    role_code: "ADMIN",
    status: "ACTIVE",
  };

  if (args.phone) {
    profilePayload.phone = args.phone;
  }

  const { error: profileUpsertError } = await admin
    .from("profiles")
    .upsert(profilePayload as never, {
      onConflict: "id",
    });

  if (profileUpsertError) {
    throw new Error(`Unable to upsert admin profile: ${profileUpsertError.message}`);
  }
}

async function main() {
  const env = readEnv();
  const args = parseArgs(env);
  const admin = createAdminClient(env);

  const ensuredAuthUser = await ensureAuthUser(admin, args);
  await ensureAdminProfile(admin, args, ensuredAuthUser.userId);

  console.info(
    `Bootstrap admin ${ensuredAuthUser.mode === "created" ? "created" : "updated"} successfully.`,
  );
  console.info(`- User ID: ${ensuredAuthUser.userId}`);
  console.info(`- Email: ${args.email}`);
  console.info(`- Password: ${args.password}`);
  console.info(`- Full name: ${args.fullName}`);
  console.info("- Role: ADMIN");
  console.info("- Status: ACTIVE");
  console.info(
    `- Must change password: ${args.mustChangePassword ? "true" : "false"}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
