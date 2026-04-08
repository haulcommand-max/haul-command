/**
 * Shared worker result contract used by all internal worker routes.
 * Every worker entrypoint must return this shape.
 */
export type WorkerStatus = "ok" | "queued" | "failed";

export interface WorkerResult {
  status: WorkerStatus;
  job_id?: string;
  audit_id?: string;
  repriced_count?: number;
  findings_count?: number;
  pricing_version?: string;
  message: string;
  emitted_event: string;
  duration_ms: number;
  error_code?: string;
  [key: string]: unknown;
}

export interface WorkerContext {
  request_id: string;
  actor: string;
  worker_name: string;
  started_at: number; // Date.now()
}

export function buildWorkerContext(
  request_id: string,
  actor: string,
  worker_name: string,
): WorkerContext {
  return { request_id, actor, worker_name, started_at: Date.now() };
}

export function workerSuccess(
  ctx: WorkerContext,
  partial: Partial<WorkerResult>,
): WorkerResult {
  const duration_ms = Date.now() - ctx.started_at;
  const result: WorkerResult = {
    status: "ok",
    message: "Worker completed successfully.",
    emitted_event: `${ctx.worker_name}.succeeded`,
    duration_ms,
    ...partial,
  };
  console.log(
    JSON.stringify({
      level: "info",
      request_id: ctx.request_id,
      actor: ctx.actor,
      worker_name: ctx.worker_name,
      emitted_event: result.emitted_event,
      status: result.status,
      duration_ms,
    }),
  );
  return result;
}

export function workerQueued(
  ctx: WorkerContext,
  partial: Partial<WorkerResult>,
): WorkerResult {
  const duration_ms = Date.now() - ctx.started_at;
  const result: WorkerResult = {
    status: "queued",
    message: "Job queued for async processing.",
    emitted_event: `${ctx.worker_name}.queued`,
    duration_ms,
    ...partial,
  };
  console.log(
    JSON.stringify({
      level: "info",
      request_id: ctx.request_id,
      actor: ctx.actor,
      worker_name: ctx.worker_name,
      emitted_event: result.emitted_event,
      status: result.status,
      duration_ms,
    }),
  );
  return result;
}

export function workerFailed(
  ctx: WorkerContext,
  error_code: string,
  message: string,
): WorkerResult {
  const duration_ms = Date.now() - ctx.started_at;
  const result: WorkerResult = {
    status: "failed",
    message,
    error_code,
    emitted_event: `${ctx.worker_name}.failed`,
    duration_ms,
  };
  console.error(
    JSON.stringify({
      level: "error",
      request_id: ctx.request_id,
      actor: ctx.actor,
      worker_name: ctx.worker_name,
      emitted_event: result.emitted_event,
      status: result.status,
      error_code,
      duration_ms,
    }),
  );
  return result;
}
