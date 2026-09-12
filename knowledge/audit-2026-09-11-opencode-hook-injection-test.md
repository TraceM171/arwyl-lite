# OpenCode `tool.execute.after` context-injection test

**Date:** 2026-09-11
**Question:** Can an OpenCode plugin's `tool.execute.after` hook inject text that actually reaches the
model's context — the capability `phases.md` Phase 2 (porting the `status-budget` enforcement hook) is
gated on? Confirming this before writing any adapter code, per this project's own "prove the fire before
trusting any future hook" standard (`stack.md`).

## Method

Read `@opencode-ai/plugin`'s installed type declarations (`~/.opencode/node_modules/@opencode-ai/plugin/
dist/index.d.ts`) — the real, currently-installed SDK (OpenCode `1.17.8` on this machine), not
documentation prose. The `Hooks` interface shows:

```ts
"tool.execute.after"?: (input: {
    tool: string; sessionID: string; callID: string; args: any;
}, output: {
    title: string; output: string; metadata: any;
}) => Promise<void>;
```

`output` is passed by reference and the hook returns `void` — the pattern implied is mutate `output.
output` in place. Tested this directly rather than trusting the type signature alone.

**Test plugin** (`.opencode/plugins/test-hook.js` in a scratch project):
```js
export const TestHookPlugin = async () => {
  return {
    "tool.execute.after": async (input, output) => {
      output.output += "\n\n[[INJECTED_MARKER_9f3a2c: appended by a tool.execute.after plugin hook]]";
    },
  };
};
export default TestHookPlugin;
```

**Runs** (`opencode run "..." --model opencode/big-pickle --format json --dir <scratch-dir>`, a free-tier
model already configured on this machine via the `opencode` provider):

1. Prompt: run `echo hello-world`, then quote back verbatim the tool's raw output.
2. Prompt: create a file via the write tool, then quote back verbatim the tool-result text (not the
   file's own content).

## Result — confirmed, both tool types

Run 1 (`bash` tool) — the raw JSON event stream's `tool_use` part:
```
"output": "hello-world\n\n\n[[INJECTED_MARKER_9f3a2c: appended by a tool.execute.after plugin hook]]"
```
and the model's own final reply:
```
The command returned:

```
hello-world


[[INJECTED_MARKER_9f3a2c: appended by a tool.execute.after plugin hook]]
```
```

Run 2 (`write` tool — the one Phase 2 actually needs, since `status.md` edits go through `write`/`edit`,
not `bash`) — the raw event:
```
"output": "Wrote file successfully.\n\n[[INJECTED_MARKER_9f3a2c: appended by a tool.execute.after plugin hook]]"
```
and the model's reply quoted the same text back verbatim.

Two independent confirmations per run: the marker is present in the raw `tool_use` part's `state.output`
field (ground truth — this is the actual API-level content, not the model's report of it), and the model's
own generated reply demonstrably read and reported it. Note: `metadata.output` (a separate field on the
same part) stayed the original, unmutated tool output — only `output.output` carries what the model reads
as the tool result. A future adapter must mutate `output.output` specifically, not `metadata`.

## Conclusion

`tool.execute.after` **can** inject text into the model's context, confirmed live on OpenCode `1.17.8`,
on both `bash` and `write` tool calls. This resolves `phases.md` Phase 2's gating question:
building the `status-budget` port (watch `write`/`edit` calls targeting `knowledge/status.md`, check the
"recent changes" entry budget, append a warning to `output.output` when over) is a real mechanism port,
not a scope cut. Whether it *should* also block on other tool names, and the actual adapter code, is
Phase 2 implementation work — not yet done as of this audit.
