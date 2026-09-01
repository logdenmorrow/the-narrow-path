import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import {
  isLikelyDedicatedTestEmail,
  isLocalBaseUrl,
  getBaseUrl,
  mutationTestsEnabled,
  productionMutationsEnabled,
} from "./test-env";

function loadEnvironmentFile(filePath: string) {
  if (!existsSync(filePath)) return;

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

test.describe("/reflection save", () => {
  test.skip(
    !mutationTestsEnabled(),
    "Set PLAYWRIGHT_ALLOW_MUTATIONS=true to run tests that change reflection rows."
  );
  test.skip(
    !isLocalBaseUrl(getBaseUrl()) && !productionMutationsEnabled(),
    "Mutation E2E tests require a local base URL unless PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS=true."
  );
  test.skip(
    !isLikelyDedicatedTestEmail(process.env.PLAYWRIGHT_TEST_EMAIL),
    "PLAYWRIGHT_TEST_EMAIL must be a dedicated test account containing test, e2e, or playwright."
  );

  test("saves, reloads, and restores the dedicated test account state", async ({
    page,
  }) => {
    loadEnvironmentFile(".env.local");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;

    if (!supabaseUrl || !serviceKey || !testEmail) {
      throw new Error("Production QA credentials are incomplete.");
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;
    const testUser = usersData.users.find(
      (candidate) => candidate.email?.toLowerCase() === testEmail.toLowerCase()
    );
    if (!testUser) throw new Error("The dedicated Playwright user was not found.");

    const { data: gospelPlan, error: planError } = await admin
      .from("challenge_plans")
      .select("id")
      .eq("slug", "the-gospels-september-lent")
      .single();
    if (planError) throw planError;
    const { data: dayOne, error: dayError } = await admin
      .from("plan_days")
      .select("id")
      .eq("plan_id", gospelPlan.id)
      .eq("day_number", 1)
      .single();
    if (dayError) throw dayError;
    const { data: reflectionTask, error: taskError } = await admin
      .from("plan_day_tasks")
      .select("id, task_templates!inner(slug)")
      .eq("plan_day_id", dayOne.id)
      .eq("task_templates.slug", "reflection")
      .single();
    if (taskError) throw taskError;

    const { data: originalReflection, error: reflectionError } = await admin
      .from("user_reflection_entries")
      .select("*")
      .eq("user_id", testUser.id)
      .eq("plan_day_id", dayOne.id)
      .maybeSingle();
    if (reflectionError) throw reflectionError;
    const { data: originalCompletions, error: completionError } = await admin
      .from("user_task_completions")
      .select("*")
      .eq("user_id", testUser.id)
      .eq("plan_day_task_id", reflectionTask.id);
    if (completionError) throw completionError;

    const marker = `Gospel launch reflection QA ${Date.now()}`;

    try {
      await page.goto("/reflection");
      const journal = page.getByLabel("Journal Entry");
      await journal.fill(marker);
      await page.getByRole("button", { name: "Save Reflection" }).click();
      await expect(page.getByText("Reflection saved.", { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByLabel("Journal Entry")).toHaveValue(marker);
      await expect(page.getByRole("button", { name: "Saved" })).toBeDisabled();
    } finally {
      if (originalReflection) {
        const { error } = await admin
          .from("user_reflection_entries")
          .upsert(originalReflection, { onConflict: "user_id,plan_day_id" });
        if (error) throw error;
      } else {
        const { error } = await admin
          .from("user_reflection_entries")
          .delete()
          .eq("user_id", testUser.id)
          .eq("plan_day_id", dayOne.id);
        if (error) throw error;
      }

      if ((originalCompletions ?? []).length === 0) {
        const { error } = await admin
          .from("user_task_completions")
          .delete()
          .eq("user_id", testUser.id)
          .eq("plan_day_task_id", reflectionTask.id);
        if (error) throw error;
      }
    }

    const { data: restoredReflection, error: restoredReflectionError } = await admin
      .from("user_reflection_entries")
      .select("id, updated_at")
      .eq("user_id", testUser.id)
      .eq("plan_day_id", dayOne.id)
      .maybeSingle();
    if (restoredReflectionError) throw restoredReflectionError;
    expect(restoredReflection?.id ?? null).toBe(originalReflection?.id ?? null);
    expect(restoredReflection?.updated_at ?? null).toBe(
      originalReflection?.updated_at ?? null
    );

    const { count: restoredCompletionCount, error: restoredCompletionError } =
      await admin
        .from("user_task_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", testUser.id)
        .eq("plan_day_task_id", reflectionTask.id);
    if (restoredCompletionError) throw restoredCompletionError;
    expect(restoredCompletionCount).toBe((originalCompletions ?? []).length);
  });
});
