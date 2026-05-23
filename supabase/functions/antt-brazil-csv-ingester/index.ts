import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type SnapshotRow = {
  id: string;
  snapshot_month: string | null;
  csv_url: string;
  status: string | null;
  rows_total: number | null;
  rows_imported: number | null;
  attempts: number | null;
};

type AnttCarrierRow = {
  numero_rntrc: string;
  nome_transportador: string | null;
  cpf_cnpj: string | null;
  categoria_transportador: string | null;
  situacao_rntrc: string | null;
  data_primeiro_cadastro: string | null;
  data_situacao_rntrc: string | null;
  cep: string | null;
  municipio: string | null;
  uf: string | null;
  equiparado: string | null;
  heavy_haul_relevant: boolean;
  relevance_score: number;
  raw_csv_row: Record<string, string>;
  snapshot_month: string | null;
  fetched_at: string;
};

const DEFAULT_BATCH_SIZE = 750;
const DEFAULT_MAX_ROWS = 50_000;
const DEFAULT_RANGE_CHUNK_BYTES = 1024 * 1024;
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function assertInternalRequest(req: Request) {
  const expected = env("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();

  if (token !== expected) {
    throw new Error("Unauthorized");
  }
}

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getField(row: Record<string, string>, aliases: string[]): string | null {
  for (const alias of aliases) {
    const value = row[alias];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const brDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function parseCsvLine(line: string, delimiter = ";"): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function looksLikeActive(value: string | null): boolean {
  if (!value) return false;
  const normalized = normalizeHeader(value);
  return normalized.includes("ativo") || normalized.includes("habilitado") || normalized.includes("regular");
}

function scoreCarrier(row: Record<string, string>): { heavy: boolean; score: number } {
  const haystack = [
    getField(row, ["nome_transportador", "razao_social", "transportador", "nome"]),
    getField(row, ["categoria_transportador", "categoria", "tipo_transportador"]),
    getField(row, ["situacao_rntrc", "situacao", "status"]),
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const heavyTerms = [
    "carga",
    "cargas",
    "transporte",
    "transportes",
    "pesad",
    "maquina",
    "maquinas",
    "equipamento",
    "guincho",
    "guindaste",
    "especial",
    "rodoviario",
    "logistica",
  ];

  const matched = heavyTerms.filter((term) => haystack.includes(term)).length;
  const active = looksLikeActive(getField(row, ["situacao_rntrc", "situacao", "status"]));
  const score = Math.min(100, (active ? 35 : 10) + matched * 9);

  return { heavy: score >= 45, score };
}

function toCarrierRow(
  row: Record<string, string>,
  snapshotMonth: string | null,
  fetchedAt: string,
): AnttCarrierRow | null {
  const numeroRntrc = getField(row, ["numero_rntrc", "rntrc", "registro_rntrc", "cod_rntrc"]);
  if (!numeroRntrc) return null;

  const relevance = scoreCarrier(row);

  return {
    numero_rntrc: numeroRntrc,
    nome_transportador: getField(row, ["nome_transportador", "razao_social", "transportador", "nome"]),
    cpf_cnpj: getField(row, ["cpf_cnpj", "cnpj_cpf", "cnpj", "cpf"]),
    categoria_transportador: getField(row, [
      "categoria_transportador",
      "categoria",
      "tipo_transportador",
    ]),
    situacao_rntrc: getField(row, ["situacao_rntrc", "situacao", "status"]),
    data_primeiro_cadastro: normalizeDate(getField(row, [
      "data_primeiro_cadastro",
      "dt_primeiro_cadastro",
      "data_cadastro",
    ])),
    data_situacao_rntrc: normalizeDate(getField(row, [
      "data_situacao_rntrc",
      "dt_situacao_rntrc",
      "data_situacao",
    ])),
    cep: getField(row, ["cep"]),
    municipio: getField(row, ["municipio", "cidade"]),
    uf: getField(row, ["uf", "estado"]),
    equiparado: getField(row, ["equiparado"]),
    heavy_haul_relevant: relevance.heavy,
    relevance_score: relevance.score,
    raw_csv_row: row,
    snapshot_month: snapshotMonth,
    fetched_at: fetchedAt,
  };
}

async function flushBatch(
  supabase: ReturnType<typeof createClient>,
  rows: AnttCarrierRow[],
  dryRun: boolean,
): Promise<number> {
  if (rows.length === 0) return 0;
  if (dryRun) return rows.length;

  const { error } = await supabase
    .from("hc_antt_brazil_carriers")
    .upsert(rows, { onConflict: "numero_rntrc" });

  if (error) throw new Error(`ANTT carrier upsert failed: ${error.message}`);
  return rows.length;
}

async function loadSnapshot(
  supabase: ReturnType<typeof createClient>,
  snapshotId?: string,
): Promise<SnapshotRow | null> {
  return withPostgrestRetry(async () => {
    let query = supabase
      .from("hc_antt_bulk_snapshots")
      .select("id,snapshot_month,csv_url,status,rows_total,rows_imported,attempts")
      .limit(1);

    if (snapshotId) {
      query = query.eq("id", snapshotId);
    } else {
      query = query
        .in("status", ["pending", "downloading", "processing", "failed"])
        .lt("attempts", 3)
        .order("created_at", { ascending: false });
    }

    const { data, error } = await query.maybeSingle<SnapshotRow>();
    if (error) throw toPostgrestError("ANTT snapshot read failed", error);
    return data ?? null;
  });
}

async function markSnapshot(
  supabase: ReturnType<typeof createClient>,
  id: string,
  fields: Record<string, unknown>,
) {
  await withPostgrestRetry(async () => {
    const { error } = await supabase
      .from("hc_antt_bulk_snapshots")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw toPostgrestError("ANTT snapshot update failed", error);
  });
}

async function ingestCsv(options: {
  supabase: ReturnType<typeof createClient>;
  snapshot: SnapshotRow;
  dryRun: boolean;
  maxRows: number;
  batchSize: number;
  rangeChunkBytes: number;
  fetchTimeoutMs: number;
}) {
  const { supabase, snapshot, dryRun, maxRows, batchSize, rangeChunkBytes, fetchTimeoutMs } = options;
  const fetchedAt = new Date().toISOString();
  let headers: string[] | null = null;
  let delimiter: "," | ";" = ";";
  let remainder = "";
  let parsed = 0;
  let imported = 0;
  let skipped = 0;
  let batch: AnttCarrierRow[] = [];

  for await (const textChunk of fetchCsvChunks(snapshot.csv_url, rangeChunkBytes, fetchTimeoutMs)) {
    remainder += textChunk;

    const lines = remainder.split(/\r?\n/);
    remainder = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      if (!headers) {
        delimiter = line.includes(";") ? ";" : ",";
        headers = parseCsvLine(line, delimiter).map(normalizeHeader);
        continue;
      }

      const cells = parseCsvLine(line, delimiter);
      const rawRow: Record<string, string> = {};
      headers.forEach((header, index) => {
        rawRow[header] = cells[index] ?? "";
      });

      parsed++;
      const carrier = toCarrierRow(rawRow, snapshot.snapshot_month, fetchedAt);
      if (!carrier) {
        skipped++;
        continue;
      }

      batch.push(carrier);
      if (batch.length >= batchSize) {
        imported += await flushBatch(supabase, batch, dryRun);
        batch = [];
      }

      if (parsed >= maxRows) break;
    }

    if (parsed >= maxRows) break;
  }

  if (remainder.trim() && headers && parsed < maxRows) {
    const cells = parseCsvLine(remainder, delimiter);
    const rawRow: Record<string, string> = {};
    headers.forEach((header, index) => {
      rawRow[header] = cells[index] ?? "";
    });
    parsed++;
    const carrier = toCarrierRow(rawRow, snapshot.snapshot_month, fetchedAt);
    if (carrier) batch.push(carrier);
    else skipped++;
  }

  imported += await flushBatch(supabase, batch, dryRun);

  return {
    parsed,
    imported,
    skipped,
    reached_max_rows: parsed >= maxRows,
  };
}

function toPostgrestError(context: string, error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
  const detail = [
    error.message,
    error.code ? `code=${error.code}` : null,
    error.details ? `details=${error.details}` : null,
    error.hint ? `hint=${error.hint}` : null,
  ].filter(Boolean).join("; ");

  return new Error(`${context}: ${detail}`);
}

async function withPostgrestRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes("schema cache")) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }

  throw lastError;
}

async function* fetchCsvChunks(
  url: string,
  rangeChunkBytes: number,
  fetchTimeoutMs: number,
): AsyncGenerator<string> {
  if (rangeChunkBytes > 0) {
    let offset = 0;

    while (true) {
      const end = offset + rangeChunkBytes - 1;
      const response = await fetchWithTimeout(url, {
        headers: {
          accept: "text/csv,application/csv,text/plain,*/*",
          range: `bytes=${offset}-${end}`,
          "user-agent": "HaulCommand-ANTT-Ingester/1.0 (+https://www.haulcommand.com)",
        },
      }, fetchTimeoutMs);

      if (response.status === 206) {
        yield await response.text();
        const contentRange = response.headers.get("content-range");
        const match = contentRange?.match(/bytes\s+(\d+)-(\d+)\/(\d+|\*)/i);
        if (!match) {
          offset = end + 1;
          continue;
        }

        const rangeEnd = Number(match[2]);
        const total = match[3] === "*" ? null : Number(match[3]);
        if (total !== null && rangeEnd + 1 >= total) break;
        offset = rangeEnd + 1;
        continue;
      }

      if (response.status === 416) break;

      // Some official mirrors ignore Range and return 200. Fall back to response streaming
      // so we still avoid materializing the whole CSV in memory.
      if (response.ok && offset === 0 && response.body) {
        const decoder = new TextDecoder("utf-8");
        const reader = response.body.getReader();
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          yield decoder.decode(chunk.value, { stream: true });
        }
        yield decoder.decode();
        break;
      }

      throw new Error(`ANTT CSV range fetch failed: ${response.status} ${response.statusText}`);
    }

    return;
  }

  const response = await fetchWithTimeout(url, {
    headers: {
      accept: "text/csv,application/csv,text/plain,*/*",
      "user-agent": "HaulCommand-ANTT-Ingester/1.0 (+https://www.haulcommand.com)",
    },
  }, fetchTimeoutMs);

  if (!response.ok || !response.body) {
    throw new Error(`ANTT CSV fetch failed: ${response.status} ${response.statusText}`);
  }

  const decoder = new TextDecoder("utf-8");
  const reader = response.body.getReader();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    yield decoder.decode(chunk.value, { stream: true });
  }
  yield decoder.decode();
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`ANTT CSV fetch timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

Deno.serve(async (req) => {
  let snapshotForFailure: SnapshotRow | null = null;
  let supabaseForFailure: ReturnType<typeof createClient> | null = null;
  let dryRunForFailure = false;

  try {
    if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });
    supabaseForFailure = supabase;

    const body = await req.json().catch(() => ({}));
    const isManualTarget = Boolean(body.csv_url || body.snapshot_id);
    if (isManualTarget) assertInternalRequest(req);

    const dryRun = body.dry_run === true;
    dryRunForFailure = dryRun;
    const snapshot = body.csv_url
      ? {
          id: body.snapshot_id ?? "manual",
          snapshot_month: body.snapshot_month ?? null,
          csv_url: body.csv_url,
          status: "manual",
          rows_total: null,
          rows_imported: null,
          attempts: 0,
        }
      : await loadSnapshot(supabase, body.snapshot_id);

    if (!snapshot) {
      return json(200, { ok: true, processed: false, reason: "no_pending_antt_snapshot" });
    }
    snapshotForFailure = snapshot;

    const hasLedgerRow = snapshot.id !== "manual";
    if (dryRun && body.parse !== true) {
      return json(200, {
        ok: true,
        processed: false,
        dry_run: true,
        parse_skipped: true,
        snapshot_id: snapshot.id,
        snapshot_month: snapshot.snapshot_month,
        snapshot_status: snapshot.status,
        attempts: snapshot.attempts,
        rows_total: snapshot.rows_total,
        rows_imported: snapshot.rows_imported,
      });
    }

    if (!dryRun && hasLedgerRow) {
      await markSnapshot(supabase, snapshot.id, {
        status: "downloading",
        attempts: Number(snapshot.attempts ?? 0) + 1,
        last_attempt_at: new Date().toISOString(),
        error_message: null,
      });
    }

    const result = await ingestCsv({
      supabase,
      snapshot,
      dryRun,
      maxRows: Math.max(1, Math.min(Number(body.max_rows ?? DEFAULT_MAX_ROWS), 250_000)),
      batchSize: Math.max(50, Math.min(Number(body.batch_size ?? DEFAULT_BATCH_SIZE), 2_000)),
      rangeChunkBytes: Math.max(
        0,
        Math.min(Number(body.range_chunk_bytes ?? DEFAULT_RANGE_CHUNK_BYTES), 4 * 1024 * 1024),
      ),
      fetchTimeoutMs: Math.max(
        5_000,
        Math.min(Number(body.fetch_timeout_ms ?? DEFAULT_FETCH_TIMEOUT_MS), 120_000),
      ),
    });

    if (!dryRun && hasLedgerRow) {
      await markSnapshot(supabase, snapshot.id, {
        status: result.reached_max_rows ? "processing" : "complete",
        rows_total: result.parsed,
        rows_imported: Number(snapshot.rows_imported ?? 0) + result.imported,
      });
    }

    return json(200, {
      ok: true,
      processed: true,
      snapshot_id: snapshot.id,
      snapshot_month: snapshot.snapshot_month,
      dry_run: dryRun,
      ...result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === "Unauthorized") {
      return json(401, { ok: false, error: "Unauthorized" });
    }

    if (!dryRunForFailure && supabaseForFailure && snapshotForFailure && snapshotForFailure.id !== "manual") {
      await markSnapshot(supabaseForFailure, snapshotForFailure.id, {
        status: "failed",
        error_message: errorMessage,
      }).catch(() => undefined);
    }

    return json(500, {
      ok: false,
      error: errorMessage,
    });
  }
});
