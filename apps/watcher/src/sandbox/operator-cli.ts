import { sandboxOverLimit } from "./operator";

// Input is supplied through stdin by the disposable sandbox harness, never argv or logs.
async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--sandbox-only")
    throw new Error("Explicit sandbox invocation required");
  let body = "";
  for await (const chunk of process.stdin) {
    body += chunk;
    if (body.length > 4096) throw new Error("Input too large");
  }
  const input = JSON.parse(body);
  const result = await sandboxOverLimit(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
main().catch(() => {
  process.stderr.write('{"event":"sandbox_operator_failed"}\n');
  process.exitCode = 1;
});
