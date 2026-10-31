import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readWorkflow(name: string): string {
  return readFileSync(path.join(process.cwd(), ".github", "workflows", name), "utf8");
}

function runCommands(workflow: string): string[] {
  return [...workflow.matchAll(/^\s+run:\s*(.+)$/gm)].map((m) => m[1].trim());
}

test("build workflow runs lint and tests in addition to the build", () => {
  // Next.js 16 no longer lints during `next build`, so CI must lint explicitly.
  const runs = runCommands(readWorkflow("build.yml"));

  for (const cmd of ["npm ci", "npm run lint", "npm test", "npm run build"]) {
    assert.ok(runs.includes(cmd), `build.yml is missing a step running \`${cmd}\` (found: ${JSON.stringify(runs)})`);
  }
});

for (const name of ["build.yml", "repository-hygiene.yml"]) {
  test(`${name} only cancels in-progress runs for pull requests`, () => {
    // Pushes to main must never cancel each other; superseded PR runs may.
    const match = readWorkflow(name).match(/^\s+cancel-in-progress:\s*(.+)$/m);

    assert.ok(match, `${name} has no concurrency.cancel-in-progress setting`);
    assert.equal(match[1].trim(), "${{ github.event_name == 'pull_request' }}");
  });
}
