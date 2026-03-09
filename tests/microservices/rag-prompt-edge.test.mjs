import test from "node:test";
import assert from "node:assert/strict";
import { buildRagSystemPrompt, buildRagUserPrompt } from "../../services/ai-service/lib/ragPrompt.js";

test("buildRagSystemPrompt is a non-empty string", () => {
  const prompt = buildRagSystemPrompt();
  assert.equal(typeof prompt, "string");
  assert.ok(prompt.length > 0);
});

test("buildRagSystemPrompt sets auditable/concise tone", () => {
  const prompt = buildRagSystemPrompt();
  assert.match(prompt, /concise/i);
  assert.match(prompt, /auditable/i);
});

test("buildRagUserPrompt with empty context documents", () => {
  const prompt = buildRagUserPrompt("test query", []);
  assert.match(prompt, /Question: test query/);
  assert.match(prompt, /No context documents found/);
});

test("buildRagUserPrompt includes all context documents in order", () => {
  const docs = [
    { text: "First document content" },
    { text: "Second document content" },
    { text: "Third document content" },
  ];
  const prompt = buildRagUserPrompt("multi-context test", docs);

  assert.match(prompt, /Context 1: First document content/);
  assert.match(prompt, /Context 2: Second document content/);
  assert.match(prompt, /Context 3: Third document content/);
});

test("buildRagUserPrompt handles single document", () => {
  const prompt = buildRagUserPrompt("single", [{ text: "Only one doc." }]);
  assert.match(prompt, /Context 1: Only one doc\./);
  assert.ok(!prompt.includes("Context 2"));
});
