import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "@/lib/env";

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

describe("parsePublicEnv", () => {
  it("returns the public Supabase settings when valid", () => {
    expect(parsePublicEnv(validPublic)).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });
  });

  it("rejects a missing anon key and names the variable", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: validPublic.NEXT_PUBLIC_SUPABASE_URL,
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("rejects a URL that is not a valid URL", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejects empty strings", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});

describe("parseServerEnv", () => {
  it("includes the service role key next to the public settings", () => {
    const env = parseServerEnv({
      ...validPublic,
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
    });
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-key");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(
      validPublic.NEXT_PUBLIC_SUPABASE_URL,
    );
  });

  it("rejects a missing service role key", () => {
    expect(() => parseServerEnv(validPublic)).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });
});
