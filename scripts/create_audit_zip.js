const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const parentDir = path.resolve(projectRoot, "..");
const stagingDir = path.join(parentDir, "staging_audit_export");
const zipPath = path.join(parentDir, "BAIT_AL_HADAF_ERP_SOURCE_CODE_AUDIT.zip");

console.log("Source directory:", projectRoot);
console.log("Staging directory:", stagingDir);
console.log("Target ZIP path:", zipPath);

// 1. Clean or create staging directory
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Helper to copy recursively while excluding unwanted files
function copyDirFiltered(src, dest, excludeFilter) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (excludeFilter && excludeFilter(srcPath, entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath, excludeFilter);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Copy directories
const dirsToCopy = ["src", "public", "docs", "scripts"];
for (const dir of dirsToCopy) {
  const src = path.join(projectRoot, dir);
  const dest = path.join(stagingDir, dir);
  console.log(`Copying ${dir}...`);
  copyDirFiltered(src, dest, (srcPath, name) => {
    return name.startsWith(".") || name.endsWith(".log");
  });
}

// 3. Copy prisma (excluding database files and journals)
console.log("Copying prisma...");
copyDirFiltered(path.join(projectRoot, "prisma"), path.join(stagingDir, "prisma"), (srcPath, name) => {
  return name.endsWith(".db") || name.endsWith(".db-journal") || name.endsWith(".db-wal") || name.endsWith(".sqlite");
});

// 4. Copy individual root files
const rootFiles = [
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "tailwind.config.js",
  "postcss.config.js",
  "tsconfig.json",
  "next-env.d.ts",
  ".gitignore",
  ".env.example",
  "README.md",
  "SOURCE_CODE_EXPORT_REPORT.md",
  "HANDOFF.md",
  "MEMORY.md",
  "TASKS.md",
];

for (const file of rootFiles) {
  const src = path.join(projectRoot, file);
  const dest = path.join(stagingDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// 5. Security & Sanity Scan of Staged Files
console.log("Performing security audit on staged files...");
let violations = [];
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === ".env" || entry.name.startsWith(".env.") && entry.name !== ".env.example") {
      violations.push(`Forbidden env file found: ${fullPath}`);
    }
    if (entry.name.endsWith(".db") || entry.name.endsWith(".sqlite")) {
      violations.push(`Forbidden database file found: ${fullPath}`);
    }
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
      violations.push(`Forbidden directory found: ${fullPath}`);
    }
    if (entry.isDirectory()) {
      scanDir(fullPath);
    }
  }
}
scanDir(stagingDir);

if (violations.length > 0) {
  console.error("SECURITY AUDIT FAILED:", violations);
  process.exit(1);
}
console.log("Security audit passed: 0 secret files or database binaries detected.");

// 6. Create ZIP archive using native tar.exe with zip format
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log("Compressing staged files to ZIP...");
execSync(`tar --force-local -a -c -f "${zipPath}" -C "${stagingDir}" .`);

// 7. Verify generated ZIP
if (fs.existsSync(zipPath)) {
  const stats = fs.statSync(zipPath);
  console.log(`SUCCESS: Created ${zipPath}`);
  console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} else {
  console.error("ERROR: Failed to create ZIP archive.");
  process.exit(1);
}

// 8. Clean up staging directory
fs.rmSync(stagingDir, { recursive: true, force: true });
console.log("Cleaned up staging directory.");
