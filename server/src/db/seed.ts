import bcrypt from "bcryptjs";
import { db, runMigrations } from "./connection.js";
import { ROLE_DEFINITIONS, PERMISSIONS, expandRolePermissions } from "../shared/permissions.js";

runMigrations();

function seedPermissions() {
  const insert = db.prepare(`INSERT OR IGNORE INTO permissions (key) VALUES (?)`);
  for (const key of PERMISSIONS) insert.run(key);
}

function seedRoles() {
  // Every role defined in the permission catalog is a system role (protected
  // from deletion) — anything created later through the admin UI is not.
  const systemRoles = new Set(Object.keys(ROLE_DEFINITIONS));
  for (const [name, def] of Object.entries(ROLE_DEFINITIONS)) {
    const existing = db.prepare(`SELECT id FROM roles WHERE name = ?`).get(name) as { id: number } | undefined;
    const roleId = existing
      ? existing.id
      : Number(
          db
            .prepare(`INSERT INTO roles (name, description, is_system) VALUES (?, ?, ?)`)
            .run(name, def.description, systemRoles.has(name) ? 1 : 0).lastInsertRowid
        );
    // Keep is_system in sync even for a role row that already existed from a
    // previous seed run (e.g. before a role was added to systemRoles).
    db.prepare(`UPDATE roles SET is_system = ? WHERE id = ?`).run(systemRoles.has(name) ? 1 : 0, roleId);

    const permissions = expandRolePermissions(def.permissions);
    db.prepare(`DELETE FROM role_permissions WHERE role_id = ?`).run(roleId);
    const insertPerm = db.prepare(
      `INSERT INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions WHERE key = ?`
    );
    for (const key of permissions) insertPerm.run(roleId, key);
  }
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@nepalctf.org";
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) return;

  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const hash = await bcrypt.hash(password, 12);
  const result = db
    .prepare(`INSERT INTO users (full_name, email, password_hash, status) VALUES (?, ?, ?, 'ACTIVE')`)
    .run("Super Administrator", email, hash);
  const userId = Number(result.lastInsertRowid);
  const role = db.prepare(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN'`).get() as { id: number };
  db.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(userId, role.id);

  // eslint-disable-next-line no-console
  console.log(`Seeded super admin: ${email} / ${password} (change this password immediately).`);
}

function seedEvent() {
  const slug = "nepal-ctf-2026";
  const existing = db.prepare(`SELECT id FROM events WHERE slug = ?`).get(slug) as { id: number } | undefined;
  if (existing) return existing.id;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const registrationStart = new Date(now - 6 * day).toISOString();
  const earlyEnd = new Date(now + 7 * day).toISOString();
  const lateEnd = new Date(now + 15 * day).toISOString();
  const eventStart = new Date(now + 20 * day).toISOString();
  const eventEnd = new Date(now + 21 * day).toISOString();

  const result = db
    .prepare(
      `INSERT INTO events (
        name, slug, description, short_description, rules, prize_pool, venue,
        event_start_date, event_end_date, registration_start_date,
        early_registration_end_date, late_registration_end_date,
        early_registration_fee, late_registration_fee,
        payment_instructions, payment_qr_url, min_team_size, max_team_size, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'REGISTRATION_OPEN')`
    )
    .run(
      "Nepal CTF 2026",
      slug,
      "Nepal's premier capture-the-flag competition, bringing together the country's best security talent for a weekend of offense, defense and reverse engineering.",
      "Nepal's premier CTF competition.",
      "Standard CTF rules apply. No attacking competition infrastructure. No sharing flags. Be respectful.",
      "NPR 300,000 across top three teams",
      "Kathmandu, Nepal",
      eventStart,
      eventEnd,
      registrationStart,
      earlyEnd,
      lateEnd,
      5000,
      7000,
      "Pay the registration fee via PhonePe using the QR code shown, then submit the transaction reference for verification.",
      null,
      1,
      4,
    );
  const eventId = Number(result.lastInsertRowid);

  db.prepare(
    `INSERT INTO terms_versions (event_id, version, content, is_active) VALUES (?, '1.0', ?, 1)`
  ).run(
    eventId,
    "By registering for Nepal CTF 2026 you agree to compete fairly, respect the competition infrastructure, and abide by the organizers' decisions. Registration fees are non-refundable once payment is verified."
  );

  return eventId;
}

async function main() {
  seedPermissions();
  seedRoles();
  await seedSuperAdmin();
  seedEvent();
  // eslint-disable-next-line no-console
  console.log("Seed complete.");
}

main();
