#!/usr/bin/env node
/**
 * Copy articles from a remote Supabase project into local Supabase (service role on target).
 *
 * Typical: pull production-approved articles into empty local DB so `npm run dev` shows a real feed.
 *
 * Usage (from repo root, with local Supabase running):
 *   export SYNC_SOURCE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
 *   export SYNC_SOURCE_SUPABASE_KEY="<production anon key>"   # RLS: only approved rows, or use service_role for all rows
 *   export SYNC_TARGET_SUPABASE_URL="http://127.0.0.1:54321"
 *   export SYNC_TARGET_SUPABASE_SERVICE_ROLE="<local service_role from: npx supabase status>"
 *   # optional: wipe local articles first
 *   export SYNC_CLEAR_LOCAL=1
 *   node scripts/sync-articles-from-remote.mjs
 *
 * Or add the same variable names to `.env` (this script loads `.env` when vars are unset).
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadDotEnv() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq <= 0) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = val
    }
  }
}

function req(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing env: ${name}`)
    process.exit(1)
  }
  return v.replace(/\/$/, '')
}

loadDotEnv()

const sourceUrl = req('SYNC_SOURCE_SUPABASE_URL')
const sourceKey = req('SYNC_SOURCE_SUPABASE_KEY')
const targetUrl = req('SYNC_TARGET_SUPABASE_URL')
const targetKey = req('SYNC_TARGET_SUPABASE_SERVICE_ROLE')

const source = createClient(sourceUrl, sourceKey)
const target = createClient(targetUrl, targetKey)

const { data: rows, error: readErr } = await source.from('articles').select('*')

if (readErr) {
  console.error('Read from source failed:', readErr.message)
  process.exit(1)
}

if (!rows?.length) {
  console.error(
    'No rows returned from source. With the anon key, only RLS-visible rows are returned (e.g. approved articles). Use the service_role key on the source if you need every row.',
  )
  process.exit(1)
}

if (process.env.SYNC_CLEAR_LOCAL === '1') {
  const { error: delErr } = await target
    .from('articles')
    .delete()
    .gte('published_at', '1970-01-01T00:00:00.000Z')
  if (delErr) {
    console.error('Clear local articles failed:', delErr.message)
    process.exit(1)
  }
  console.log('Cleared local articles (SYNC_CLEAR_LOCAL=1).')
}

const chunk = 50
let ok = 0
for (let i = 0; i < rows.length; i += chunk) {
  const batch = rows.slice(i, i + chunk)
  const { error: upErr } = await target.from('articles').upsert(batch, { onConflict: 'id' })
  if (upErr) {
    console.error(`Upsert batch ${i / chunk + 1} failed:`, upErr.message)
    process.exit(1)
  }
  ok += batch.length
}

console.log(`Synced ${ok} article row(s) into local Supabase.`)
console.log('Keep .env pointed at local URL (127.0.0.1:54321) and restart `npm run dev`.')
