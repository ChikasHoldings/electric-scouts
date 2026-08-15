/**
 * No migration may hand the public an unconditional grant.
 *
 * Five policies in production were named "Service role full access to X" and
 * written `FOR ALL TO public USING (true)`. `TO public` is every role, not the
 * service role, and RLS policies are OR'd — so each one silently overrode the
 * admin-scoped policies beside it. The anon key ships in the browser bundle,
 * so in practice they were public grants:
 *
 *   leads              customer names, emails and phone numbers, read/write
 *   admin_reset_codes  a live admin password-reset code, readable
 *   email_events       34 recipient addresses
 *   click_tracking     forgeable click rows, which revenue is computed from
 *
 * None were in this directory — they were applied straight to the database.
 * This suite cannot see that, and says so below rather than pretending
 * otherwise. What it can do is stop the same shape arriving through a
 * migration, and keep the reasoning attached to the tables that matter.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase', 'migrations');

const files = fs
  .readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => ({ name: f, sql: fs.readFileSync(path.join(MIGRATIONS, f), 'utf8') }));

/** Statements only — comments explain these mistakes at length on purpose. */
function statementsOf(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

/** Tables whose contents are either personal data or a security control. */
const SENSITIVE = [
  'leads',
  'lead_deliveries',
  'lead_buyers',
  'revenue_events',
  'email_events',
  'admin_reset_codes',
  'admin_security_events',
  'click_tracking',
  'profiles',
  'concierge_requests',
  'custom_business_quotes',
];

describe('migrations never grant the public an unconditional policy', () => {
  test('no CREATE POLICY ... TO public ... USING (true) on a sensitive table', () => {
    const offenders = [];
    for (const { name, sql } of files) {
      const body = statementsOf(sql);
      // Each CREATE POLICY statement, up to its terminating semicolon.
      for (const match of body.matchAll(/create\s+policy[\s\S]*?;/gi)) {
        const statement = match[0];
        const table = statement.match(/\bon\s+(?:public\.)?"?(\w+)"?/i)?.[1];
        if (!table || !SENSITIVE.includes(table)) continue;

        const toPublic = /\bto\s+public\b/i.test(statement);
        const usingTrue = /\busing\s*\(\s*true\s*\)/i.test(statement);
        const checkTrue = /\bwith\s+check\s*\(\s*true\s*\)/i.test(statement);

        // A public INSERT with CHECK (true) is how the anonymous forms work,
        // and is fine — a visitor may submit, and cannot read anything back.
        const insertOnly = /\bfor\s+insert\b/i.test(statement);

        if (toPublic && (usingTrue || (checkTrue && !insertOnly))) {
          offenders.push(`${name}: policy on "${table}" grants the public an unconditional rule`);
        }
      }
    }
    assert.deepEqual(
      offenders, [],
      'TO public is every role including anon, and policies are OR\'d — such a ' +
        'policy overrides every admin-scoped policy on the table'
    );
  });

  test('no migration names a policy for the service role', () => {
    // service_role carries BYPASSRLS, so a policy for it is always either a
    // no-op or — as it was here — a grant to somebody else.
    const offenders = [];
    for (const { name, sql } of files) {
      for (const match of statementsOf(sql).matchAll(/create\s+policy\s+"([^"]*)"/gi)) {
        if (/service[\s_]role/i.test(match[1])) {
          offenders.push(`${name}: "${match[1]}"`);
        }
      }
    }
    assert.deepEqual(offenders, [], 'service_role bypasses RLS; a policy for it cannot be needed');
  });

  test('the fix that removed them is present and irreversible by omission', () => {
    const drop = files.find((f) => f.name.startsWith('025_'));
    assert.ok(drop, 'migration 025 is missing');
    for (const table of ['leads', 'admin_reset_codes', 'email_events', 'click_tracking', 'admin_security_events']) {
      assert.match(
        drop.sql, new RegExp(`drop policy if exists[^;]*on public\\.${table}`, 'i'),
        `025 no longer drops the public policy on ${table}`
      );
    }
  });

  test('the SECURITY DEFINER predicates have a pinned search_path', () => {
    const pin = files.find((f) => f.name.startsWith('026_'));
    assert.ok(pin, 'migration 026 is missing');
    for (const fn of ['is_admin', 'is_admin_staff', 'is_admin_editor']) {
      assert.match(
        pin.sql, new RegExp(`alter function public\\.${fn}\\(\\) set search_path`, 'i'),
        `${fn}() no longer has its search_path pinned`
      );
    }
    assert.ok(
      !/set search_path\s*=\s*pg_temp/i.test(pin.sql),
      'pg_temp must not come first — caller temp objects would shadow real ones'
    );
  });

  test('the admin predicates keep EXECUTE, because RLS evaluates as the caller', () => {
    // Revoking it turns every anonymous read of a table carrying an admin
    // policy into a permission error rather than an empty result.
    for (const { name, sql } of files) {
      const body = statementsOf(sql);
      for (const fn of ['is_admin', 'is_admin_staff', 'is_admin_editor']) {
        assert.ok(
          !new RegExp(`revoke[^;]*execute[^;]*\\b${fn}\\(\\)[^;]*from[^;]*\\b(anon|authenticated|public)\\b`, 'is').test(body),
          `${name} revokes EXECUTE on ${fn}() — that breaks anonymous reads of any table with an admin policy`
        );
      }
    }
  });
});
