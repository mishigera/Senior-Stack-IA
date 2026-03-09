import test from "node:test";
import assert from "node:assert/strict";
import { buildRagSystemPrompt, buildRagUserPrompt } from "../../services/ai-service/lib/ragPrompt.js";

test("buildRagSystemPrompt enforces evidence-based behavior", () => {
  const prompt = buildRagSystemPrompt();
  assert.match(prompt, /provided context snippets/i);
  assert.match(prompt, /do not have enough evidence/i);
});

test("buildRagUserPrompt includes query and ordered contexts", () => {
  const prompt = buildRagUserPrompt("What is admin role?", [
    { text: "Admin can manage users." },
    { text: "Admin can assign roles." },
  ]);

  assert.match(prompt, /Question: What is admin role\?/);
  assert.match(prompt, /Context 1: Admin can manage users\./);
  assert.match(prompt, /Context 2: Admin can assign roles\./);
});
