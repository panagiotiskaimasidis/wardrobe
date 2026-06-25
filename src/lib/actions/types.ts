/** Discriminated result returned by server actions so the client can handle
 * success and validation/permission errors without try/catch across the
 * action boundary. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
