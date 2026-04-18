import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const schemaPath = path.resolve(
  __dirname,
  "../supabase/migrations/0001_schema.sql",
);
const schemaSql = fs.readFileSync(schemaPath, "utf8");

describe("canonical SQL regression guards", () => {
  it("locks audit RPC direct execute from authenticated clients", () => {
    expect(schemaSql).toMatch(
      /revoke execute on function public\.log_audit_event\(text, text, text, uuid, jsonb\) from authenticated;/i,
    );
    expect(schemaSql).toMatch(
      /grant execute on function public\.log_audit_event\(text, text, text, uuid, jsonb\) to service_role;/i,
    );
    expect(schemaSql).not.toMatch(
      /grant execute on function public\.log_audit_event\(text, text, text, uuid, jsonb\) to authenticated;/i,
    );
  });

  it("supports trusted actor identity when audit is written through service role", () => {
    expect(schemaSql).toContain("__actor_id");
    expect(schemaSql).toMatch(
      /v_actor_id := nullif\(v_raw_metadata ->> '__actor_id', ''\)::uuid;/i,
    );
    expect(schemaSql).toMatch(
      /v_metadata := v_raw_metadata - '__actor_id';/i,
    );
  });

  it("keeps current_user_role constrained to ACTIVE profiles", () => {
    expect(schemaSql).toMatch(
      /create or replace function public\.current_user_role\(\)[\s\S]*where p\.id = auth\.uid\(\)[\s\S]*and p\.status = 'ACTIVE'/i,
    );
  });

  it("uses canonical enrollment drop audit action", () => {
    expect(schemaSql).toMatch(/'ENROLLMENT_DROPPED'/);
    expect(schemaSql).not.toMatch(/'ENROLLMENT_CANCELLED'/);
  });

  it("preserves enrollment history by restricting student delete cascade", () => {
    expect(schemaSql).toMatch(
      /add constraint enrollments_student_id_fkey[\s\S]*on delete restrict/i,
    );
  });

  it("retains schedule overlap exclusion constraint", () => {
    expect(schemaSql).toMatch(/exclude using gist/i);
  });
});
