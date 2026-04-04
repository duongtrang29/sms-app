import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

import type { Database } from "../src/types/database";

loadEnvConfig(process.cwd());

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

type CliArgs = {
  email: string;
  fullName: string;
  mustChangePassword: boolean;
  password: string;
  phone?: string;
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

function parseArgs(): CliArgs {
  const email = readArg("--email")?.trim().toLowerCase();
  const password = readArg("--password")?.trim();
  const fullName = readArg("--full-name")?.trim();
  const phone = readArg("--phone")?.trim();
  const mustChangePassword = parseBoolean(
    readArg("--must-change-password"),
    true,
  );

  if (!email || !password || !fullName) {
    throw new Error(
      [
        "Missing required arguments.",
        "Usage:",
        'npm run admin:bootstrap -- --email admin@example.com --password "StrongPassword123!" --full-name "System Admin" [--phone 0900000000] [--must-change-password true]',
      ].join("\n"),
    );
  }

  return {
    email,
    fullName,
    mustChangePassword,
    password,
    ...(phone ? { phone } : {}),
  };
}

function createAdminClient() {
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

async function main() {
  const args = parseArgs();
  const admin = createAdminClient();

  const { data: existingProfileRow, error: profileLookupError } = await admin
    .from("profiles")
    .select("id, role_code, email")
    .eq("email", args.email)
    .maybeSingle();

  const existingProfile = existingProfileRow as
    | { email: string; id: string; role_code: string }
    | null;

  if (profileLookupError) {
    throw new Error(`Unable to check existing profile: ${profileLookupError.message}`);
  }

  if (existingProfile) {
    throw new Error(
      `A profile already exists for ${args.email} with role ${existingProfile.role_code}. Refusing to overwrite it.`,
    );
  }

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

  const { error: profileInsertError } = await admin.from("profiles").insert({
    email: args.email,
    full_name: args.fullName,
    id: createdUser.user.id,
    metadata: {
      source: "bootstrap-admin-script",
    },
    must_change_password: args.mustChangePassword,
    phone: args.phone ?? null,
    role_code: "ADMIN",
    status: "ACTIVE",
  } as never);

  if (profileInsertError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    throw new Error(`Unable to create admin profile: ${profileInsertError.message}`);
  }

  console.info("Bootstrap admin created successfully.");
  console.info(`- User ID: ${createdUser.user.id}`);
  console.info(`- Email: ${args.email}`);
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
