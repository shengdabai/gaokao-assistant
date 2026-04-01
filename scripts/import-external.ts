/**
 * Import external data sources into SQLite database
 * Run: npx tsx scripts/import-external.ts
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "gaokao.db");

if (!fs.existsSync(DB_PATH)) {
  console.error("Database not found. Start the dev server first to auto-create it.");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// --- 1. Import laosheng.top 985/211 tags ---
console.log("\n=== Importing laosheng.top school tags ===");

const laoshengPath = path.join(process.cwd(), "data", "laosheng_tags.json");
if (fs.existsSync(laoshengPath)) {
  const tags = JSON.parse(fs.readFileSync(laoshengPath, "utf-8"));

  const updateTags = db.prepare(`
    UPDATE schools SET
      is_985 = ?,
      is_211 = ?,
      is_double_first = ?,
      tags = ?
    WHERE name = ?
  `);

  let matched = 0;
  const tx = db.transaction(() => {
    for (const t of tags) {
      const is985 = t.is_985 ? 1 : 0;
      const is211 = t.is_211 ? 1 : 0;
      const isDF = t.is_double_first ? 1 : 0;
      const tagStr = [
        is985 ? "985" : "",
        is211 ? "211" : "",
        isDF ? "双一流" : "",
        t.type || "",
      ]
        .filter(Boolean)
        .join(",");

      const result = updateTags.run(is985, is211, isDF, tagStr, t.name);
      if (result.changes > 0) matched++;
    }
  });
  tx();
  console.log(`  laosheng: ${tags.length} schools in source, ${matched} matched to our DB`);
} else {
  console.log("  laosheng_tags.json not found, skipping.");
}

// --- 2. Import colleges.chat reputation data ---
console.log("\n=== Importing colleges.chat reputation ===");

// Add reputation columns if not exist (ignore errors for existing columns)
const addCols = [
  `ALTER TABLE schools ADD COLUMN dorm_info TEXT DEFAULT ''`,
  `ALTER TABLE schools ADD COLUMN food_info TEXT DEFAULT ''`,
  `ALTER TABLE schools ADD COLUMN campus_info TEXT DEFAULT ''`,
  `ALTER TABLE schools ADD COLUMN additional_comments TEXT DEFAULT ''`,
  `ALTER TABLE schools ADD COLUMN response_count INTEGER DEFAULT 0`,
];
for (const sql of addCols) {
  try { db.exec(sql); } catch { /* column already exists */ }
}

const collegesPath = path.join(process.cwd(), "data", "colleges_chat.json");
if (fs.existsSync(collegesPath)) {
  const raw = JSON.parse(fs.readFileSync(collegesPath, "utf-8"));
  const colleges: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw.universities || raw.schools || Object.values(raw)[0] || []);

  const updateReputation = db.prepare(`
    UPDATE schools SET
      reputation_score = ?,
      reputation_summary = ?,
      dorm_info = ?,
      food_info = ?,
      campus_info = ?,
      additional_comments = ?,
      response_count = ?
    WHERE name = ?
  `);

  let matched = 0;
  const tx = db.transaction(() => {
    for (const c of colleges) {
      // Build summary from dorm/food/campus info
      const dormStr = typeof c.dorm_info === "object" ? JSON.stringify(c.dorm_info) : String(c.dorm_info || "");
      const foodStr = typeof c.food_info === "object" ? JSON.stringify(c.food_info) : String(c.food_info || "");
      const campusStr = typeof c.campus_info === "object" ? JSON.stringify(c.campus_info) : String(c.campus_info || "");
      const comments = typeof c.additional_comments === "object"
        ? JSON.stringify(c.additional_comments)
        : String(c.additional_comments || "");

      // Calculate a simple reputation score based on response count
      const responseCount = Number(c.response_count) || 0;
      const score = Math.min(10, Math.round((responseCount / 5) * 10) / 10);

      // Build a text summary
      const summaryParts: string[] = [];
      if (dormStr && dormStr !== "{}") summaryParts.push(`宿舍: ${dormStr.slice(0, 200)}`);
      if (foodStr && foodStr !== "{}") summaryParts.push(`饮食: ${foodStr.slice(0, 200)}`);
      if (campusStr && campusStr !== "{}") summaryParts.push(`校园: ${campusStr.slice(0, 200)}`);
      const summary = summaryParts.join(" | ").slice(0, 500);

      const result = updateReputation.run(
        score,
        summary,
        dormStr.slice(0, 2000),
        foodStr.slice(0, 2000),
        campusStr.slice(0, 2000),
        comments.slice(0, 2000),
        responseCount,
        c.name
      );
      if (result.changes > 0) matched++;
    }
  });
  tx();
  console.log(`  colleges.chat: ${colleges.length} schools in source, ${matched} matched to our DB`);
} else {
  console.log("  colleges_chat.json not found, skipping.");
}

// --- 3. Import kkdaxue.com data ---
console.log("\n=== Importing kkdaxue.com data ===");

try { db.exec(`ALTER TABLE schools ADD COLUMN kkdaxue_info TEXT DEFAULT ''`); } catch {}

const kkdaxuePath = path.join(process.cwd(), "data", "kkdaxue.json");
if (fs.existsSync(kkdaxuePath)) {
  const kkdata = JSON.parse(fs.readFileSync(kkdaxuePath, "utf-8"));

  const updateKK = db.prepare(`
    UPDATE schools SET kkdaxue_info = ? WHERE name = ?
  `);

  let matched = 0;
  if (kkdata.schools && Array.isArray(kkdata.schools)) {
    const tx = db.transaction(() => {
      for (const s of kkdata.schools) {
        const name = s.name || s.school_name || "";
        if (!name) continue;

        // Extract useful info
        const info: Record<string, unknown> = {};
        if (s.majors) info.majors = s.majors;
        if (s.posts) info.post_count = Array.isArray(s.posts) ? s.posts.length : 0;
        if (s.education_distribution) info.education = s.education_distribution;

        // Get top posts summaries
        if (Array.isArray(s.posts) || Array.isArray(s.majors)) {
          const posts = s.posts || [];
          info.top_reviews = posts.slice(0, 5).map((p: Record<string, string>) => ({
            title: p.title || "",
            content: (p.content || "").slice(0, 200),
          }));
        }

        const infoStr = JSON.stringify(info).slice(0, 3000);
        const result = updateKK.run(infoStr, name);
        if (result.changes > 0) matched++;
      }
    });
    tx();
    console.log(`  kkdaxue: ${kkdata.schools.length} schools with content, ${matched} matched to our DB`);
  }
} else {
  console.log("  kkdaxue.json not found, skipping.");
}

// --- Print summary ---
console.log("\n=== Import Summary ===");
const stats = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN is_985 = 1 THEN 1 ELSE 0 END) as count_985,
    SUM(CASE WHEN is_211 = 1 THEN 1 ELSE 0 END) as count_211,
    SUM(CASE WHEN reputation_score > 0 THEN 1 ELSE 0 END) as has_reputation,
    SUM(CASE WHEN dorm_info != '' AND dorm_info IS NOT NULL THEN 1 ELSE 0 END) as has_dorm,
    SUM(CASE WHEN kkdaxue_info != '' AND kkdaxue_info IS NOT NULL THEN 1 ELSE 0 END) as has_kkdaxue
  FROM schools
`).get();
console.log(stats);

db.close();
console.log("\nDone!");
