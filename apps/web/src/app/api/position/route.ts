import { readProxyConfig } from "../../../server/admission";
import { readPositionConfig } from "../../../server/position/config";
import { createPositionHandler, type PositionHandler } from "../../../server/position/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let handler: PositionHandler | undefined;
function handle(request: Request): Promise<Response> {
  const proxy = readProxyConfig(process.env);
  handler ??= createPositionHandler({
    ...(proxy ? { proxy } : {}),
    config: readPositionConfig(process.env),
    ...(process.env.MAX_DATA_AGE_MS === undefined
      ? {}
      : {
          maxDataAgeMs: /^[1-9][0-9]*$/.test(process.env.MAX_DATA_AGE_MS)
            ? Number(process.env.MAX_DATA_AGE_MS)
            : 0,
        }),
  });
  return handler(request);
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
