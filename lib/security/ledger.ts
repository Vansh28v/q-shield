import { DatabaseSync } from "node:sqlite";
import { getDatabase } from "./db";

export type ReplayCheckReason =
  | "NEW"
  | "SIGNATURE_ALREADY_SEEN"
  | "NONCE_ALREADY_SEEN"
  | "SESSION_NONCE_ALREADY_SEEN"
  | "EXACT_TRANSACTION_ALREADY_SEEN";

export interface ReplayRecord {
  signatureId: string;
  sessionId: string;
  nonce: string;
  signerId: string;
  createdAt: number;
  consumed: boolean;
}

export interface LedgerCheckResult {
  fresh: boolean;
  reason: ReplayCheckReason;
  record?: ReplayRecord;
}

export type ReplayCheckResult = LedgerCheckResult;

export interface ReplayLedgerOptions {
  memoryOnly?: boolean;
  db?: DatabaseSync;
}

export class ReplayLedger {
  private readonly memoryOnly: boolean;
  private db: DatabaseSync | null;

  /*
   * Existing/general ledger state.
   *
   * These are intentionally preserved because other parts of Q-SHIELD
   * may use ReplayLedger as a broader freshness ledger.
   */
  private readonly records = new Map<string, ReplayRecord>();
  private readonly sessionNonces = new Set<string>();
  private readonly nonces = new Set<string>();

  /*
   * Exact transaction ledger.
   *
   * Exact replay identity is:
   *
   *   signatureId + sessionId + nonce
   *
   * This is intentionally separate from the broader freshness rules above.
   */
  private readonly exactRecords = new Map<string, ReplayRecord>();

  constructor(options: ReplayLedgerOptions = {}) {
    this.memoryOnly = options.memoryOnly === true;

    if (this.memoryOnly) {
      this.db = null;
    } else {
      this.db = options.db ?? getDatabase();
      this.initializeExactReplayTable();
    }
  }

  /**
   * Existing/general replay check.
   *
   * This preserves the original behavior:
   * - same signature
   * - same session + nonce
   * - same nonce
   *
   * can be considered already seen.
   */
  check(
    signatureId: string,
    sessionId: string,
    nonce: string,
  ): LedgerCheckResult {
    this.validateIdentifiers(
      signatureId,
      sessionId,
      nonce,
    );

    const existingSignature = this.records.get(signatureId);

    if (existingSignature) {
      return {
        fresh: false,
        reason: "SIGNATURE_ALREADY_SEEN",
        record: existingSignature,
      };
    }

    const sessionNonceKey = `${sessionId}:${nonce}`;

    if (this.sessionNonces.has(sessionNonceKey)) {
      return {
        fresh: false,
        reason: "SESSION_NONCE_ALREADY_SEEN",
      };
    }

    if (this.nonces.has(nonce)) {
      return {
        fresh: false,
        reason: "NONCE_ALREADY_SEEN",
      };
    }

    if (this.db) {
      try {
        const signatureRow = this.db
          .prepare(
            `
              SELECT
                signature_id,
                session_id,
                nonce,
                signer_id,
                created_at
              FROM replay_ledger
              WHERE signature_id = ?
              LIMIT 1
            `,
          )
          .get(signatureId) as
          | {
              signature_id: string;
              session_id: string;
              nonce: string;
              signer_id: string;
              created_at: number;
            }
          | undefined;

        if (signatureRow) {
          const record = this.toReplayRecord(signatureRow);

          this.cacheRecord(record);

          return {
            fresh: false,
            reason: "SIGNATURE_ALREADY_SEEN",
            record,
          };
        }

        const sessionNonceRow = this.db
          .prepare(
            `
              SELECT
                signature_id,
                session_id,
                nonce,
                signer_id,
                created_at
              FROM replay_ledger
              WHERE session_id = ?
                AND nonce = ?
              LIMIT 1
            `,
          )
          .get(sessionId, nonce) as
          | {
              signature_id: string;
              session_id: string;
              nonce: string;
              signer_id: string;
              created_at: number;
            }
          | undefined;

        if (sessionNonceRow) {
          const record = this.toReplayRecord(
            sessionNonceRow,
          );

          this.cacheRecord(record);

          return {
            fresh: false,
            reason: "SESSION_NONCE_ALREADY_SEEN",
            record,
          };
        }

        const nonceRow = this.db
          .prepare(
            `
              SELECT
                signature_id,
                session_id,
                nonce,
                signer_id,
                created_at
              FROM replay_ledger
              WHERE nonce = ?
              LIMIT 1
            `,
          )
          .get(nonce) as
          | {
              signature_id: string;
              session_id: string;
              nonce: string;
              signer_id: string;
              created_at: number;
            }
          | undefined;

        if (nonceRow) {
          const record = this.toReplayRecord(nonceRow);

          this.cacheRecord(record);

          return {
            fresh: false,
            reason: "NONCE_ALREADY_SEEN",
            record,
          };
        }
      } catch {
        // Continue using the in-memory ledger if SQLite
        // is temporarily unavailable.
      }
    }

    return {
      fresh: true,
      reason: "NEW",
    };
  }

  /**
   * Exact replay check.
   *
   * A transaction is considered the same transaction ONLY when
   * all three identifiers match:
   *
   *   signatureId + sessionId + nonce
   *
   * Therefore:
   *
   * same signature + different nonce  -> NEW
   * same nonce + different session    -> NEW
   * same session + nonce + different signature -> NEW
   * exact same tuple                  -> REPLAY
   */
  checkExact(
    signatureId: string,
    sessionId: string,
    nonce: string,
  ): LedgerCheckResult {
    this.validateIdentifiers(
      signatureId,
      sessionId,
      nonce,
    );

    const key = this.getExactKey(
      signatureId,
      sessionId,
      nonce,
    );

    const memoryRecord = this.exactRecords.get(key);

    if (memoryRecord) {
      return {
        fresh: false,
        reason: "EXACT_TRANSACTION_ALREADY_SEEN",
        record: memoryRecord,
      };
    }

    if (!this.db) {
      return {
        fresh: true,
        reason: "NEW",
      };
    }

    try {
      const row = this.db
        .prepare(
          `
            SELECT
              signature_id,
              session_id,
              nonce,
              signer_id,
              created_at
            FROM qshield_exact_replay_ledger
            WHERE signature_id = ?
              AND session_id = ?
              AND nonce = ?
            LIMIT 1
          `,
        )
        .get(
          signatureId,
          sessionId,
          nonce,
        ) as
        | {
            signature_id: string;
            session_id: string;
            nonce: string;
            signer_id: string;
            created_at: number;
          }
        | undefined;

      if (!row) {
        return {
          fresh: true,
          reason: "NEW",
        };
      }

      const record = this.toReplayRecord(row);

      this.exactRecords.set(
        key,
        record,
      );

      return {
        fresh: false,
        reason: "EXACT_TRANSACTION_ALREADY_SEEN",
        record,
      };
    } catch {
      /*
       * If SQLite cannot be queried, use the local exact ledger.
       * This does not manufacture a replay result.
       */
      return {
        fresh: true,
        reason: "NEW",
      };
    }
  }

  record(
    signatureId: string,
    sessionId: string,
    nonce: string,
    signerId: string,
    createdAt: number = Date.now(),
  ): ReplayRecord {
    this.validateIdentifiers(
      signatureId,
      sessionId,
      nonce,
    );

    if (!signerId || !signerId.trim()) {
      throw new Error(
        "Signer ID cannot be empty",
      );
    }

    if (!Number.isFinite(createdAt)) {
      throw new Error(
        "createdAt must be finite",
      );
    }

    const checkResult = this.check(
      signatureId,
      sessionId,
      nonce,
    );

    if (!checkResult.fresh) {
      throw new Error(
        checkResult.reason,
      );
    }

    const record: ReplayRecord = {
      signatureId,
      sessionId,
      nonce,
      signerId,
      createdAt,
      consumed: true,
    };

    if (this.db) {
      try {
        this.db
          .prepare(
            `
              INSERT INTO replay_ledger (
                signature_id,
                session_id,
                nonce,
                signer_id,
                created_at
              )
              VALUES (?, ?, ?, ?, ?)
            `,
          )
          .run(
            signatureId,
            sessionId,
            nonce,
            signerId,
            createdAt,
          );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        if (
          message.includes("UNIQUE") ||
          message.includes("constraint")
        ) {
          throw new Error(
            "SIGNATURE_ALREADY_SEEN",
          );
        }

        this.db = null;
      }
    }

    this.cacheRecord(record);

    return record;
  }

  /**
   * Record an exact transaction.
   *
   * This does NOT use the broader check()/record() rules.
   */
  recordExact(
    signatureId: string,
    sessionId: string,
    nonce: string,
    signerId: string,
    createdAt: number = Date.now(),
  ): ReplayRecord {
    this.validateIdentifiers(
      signatureId,
      sessionId,
      nonce,
    );

    if (!signerId || !signerId.trim()) {
      throw new Error(
        "Signer ID cannot be empty",
      );
    }

    if (!Number.isFinite(createdAt)) {
      throw new Error(
        "createdAt must be finite",
      );
    }

    const existing = this.checkExact(
      signatureId,
      sessionId,
      nonce,
    );

    if (!existing.fresh) {
      throw new Error(
        "EXACT_TRANSACTION_ALREADY_SEEN",
      );
    }

    const record: ReplayRecord = {
      signatureId,
      sessionId,
      nonce,
      signerId,
      createdAt,
      consumed: true,
    };

    const key = this.getExactKey(
      signatureId,
      sessionId,
      nonce,
    );

    if (this.db) {
      try {
        this.db
          .prepare(
            `
              INSERT INTO qshield_exact_replay_ledger (
                signature_id,
                session_id,
                nonce,
                signer_id,
                created_at
              )
              VALUES (?, ?, ?, ?, ?)
            `,
          )
          .run(
            signatureId,
            sessionId,
            nonce,
            signerId,
            createdAt,
          );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        if (
          message.includes("UNIQUE") ||
          message.includes("constraint")
        ) {
          const persisted = this.checkExact(
            signatureId,
            sessionId,
            nonce,
          );

          if (!persisted.fresh) {
            throw new Error(
              "EXACT_TRANSACTION_ALREADY_SEEN",
            );
          }
        }

        /*
         * Do not silently switch to a different replay identity.
         * Cache the transaction locally so the current process
         * still has a deterministic exact ledger.
         */
      }
    }

    this.exactRecords.set(
      key,
      record,
    );

    return record;
  }

  has(signatureId: string): boolean {
    if (!signatureId || !signatureId.trim()) {
      return false;
    }

    if (this.records.has(signatureId)) {
      return true;
    }

    if (!this.db) {
      return false;
    }

    try {
      const row = this.db
        .prepare(
          `
            SELECT 1
            FROM replay_ledger
            WHERE signature_id = ?
            LIMIT 1
          `,
        )
        .get(signatureId);

      return Boolean(row);
    } catch {
      return false;
    }
  }

  get(
    signatureId: string,
  ): ReplayRecord | undefined {
    if (!signatureId || !signatureId.trim()) {
      return undefined;
    }

    const cached = this.records.get(signatureId);

    if (cached) {
      return cached;
    }

    if (!this.db) {
      return undefined;
    }

    try {
      const row = this.db
        .prepare(
          `
            SELECT
              signature_id,
              session_id,
              nonce,
              signer_id,
              created_at
            FROM replay_ledger
            WHERE signature_id = ?
            LIMIT 1
          `,
        )
        .get(signatureId) as
        | {
            signature_id: string;
            session_id: string;
            nonce: string;
            signer_id: string;
            created_at: number;
          }
        | undefined;

      if (!row) {
        return undefined;
      }

      const record = this.toReplayRecord(row);

      this.cacheRecord(record);

      return record;
    } catch {
      return undefined;
    }
  }

  size(): number {
    if (this.memoryOnly || !this.db) {
      return this.records.size;
    }

    try {
      const row = this.db
        .prepare(
          `
            SELECT COUNT(*) AS count
            FROM replay_ledger
          `,
        )
        .get() as { count: number };

      return Number(row.count);
    } catch {
      return this.records.size;
    }
  }

  clear(): void {
    this.records.clear();
    this.sessionNonces.clear();
    this.nonces.clear();
    this.exactRecords.clear();

    if (!this.db || this.memoryOnly) {
      return;
    }

    try {
      this.db
        .prepare(
          "DELETE FROM replay_ledger",
        )
        .run();

      this.db
        .prepare(
          "DELETE FROM qshield_exact_replay_ledger",
        )
        .run();
    } catch {
      // In-memory state is already cleared.
    }
  }

  private initializeExactReplayTable(): void {
    if (!this.db) {
      return;
    }

    try {
      this.db.exec(
        `
          CREATE TABLE IF NOT EXISTS qshield_exact_replay_ledger (
            signature_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            nonce TEXT NOT NULL,
            signer_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            PRIMARY KEY (
              signature_id,
              session_id,
              nonce
            )
          )
        `,
      );
    } catch {
      /*
       * The existing replay ledger remains usable.
       * If this table cannot be initialized, the exact ledger
       * will still use its in-memory state for the current process.
       */
    }
  }

  private getExactKey(
    signatureId: string,
    sessionId: string,
    nonce: string,
  ): string {
    return JSON.stringify([
      signatureId,
      sessionId,
      nonce,
    ]);
  }

  private validateIdentifiers(
    signatureId: string,
    sessionId: string,
    nonce: string,
  ): void {
    if (!signatureId || !signatureId.trim()) {
      throw new Error(
        "Signature ID cannot be empty",
      );
    }

    if (!sessionId || !sessionId.trim()) {
      throw new Error(
        "Session ID cannot be empty",
      );
    }

    if (!nonce || !nonce.trim()) {
      throw new Error(
        "Nonce cannot be empty",
      );
    }
  }

  private cacheRecord(
    record: ReplayRecord,
  ): void {
    this.records.set(
      record.signatureId,
      record,
    );

    this.sessionNonces.add(
      `${record.sessionId}:${record.nonce}`,
    );

    this.nonces.add(
      record.nonce,
    );
  }

  private toReplayRecord(row: {
    signature_id: string;
    session_id: string;
    nonce: string;
    signer_id: string;
    created_at: number;
  }): ReplayRecord {
    return {
      signatureId: row.signature_id,
      sessionId: row.session_id,
      nonce: row.nonce,
      signerId: row.signer_id,
      createdAt: row.created_at,
      consumed: true,
    };
  }
}