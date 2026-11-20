const fs = require('fs');
const base = 'C:\\Users\\agash\\OneDrive\\Desktop\\Shop work\\CLAUDE\\src\\app\\';

function patchFile(rel, replacements) {
  const p = base + rel;
  let t = fs.readFileSync(p, 'utf8');
  let changed = false;
  replacements.forEach(([oldStr, newStr]) => {
    if (t.includes(oldStr)) {
      t = t.replaceAll(oldStr, newStr);
      changed = true;
    } else {
      console.log('skip not found in', rel, ':', oldStr.slice(0, 60).replace(/\n/g, '\\n'));
    }
  });
  if (changed) {
    fs.writeFileSync(p, t);
    console.log('patched', rel);
  }
}

// reports page
patchFile('reports\\page.tsx', [
  ['import { formatCurrency, formatDate } from "@/lib/utils";', 'import { formatCurrency, formatDate, safeJson, ensureOk } from "@/lib/utils";'],
  ['const data = await res.json();\n      if (!res.ok) throw new Error(data.error || "Failed to load report");', 'const data = await safeJson<any>(res);\n      ensureOk(res, data, "Failed to load report");'],
]);

// grn page
patchFile('grn\\page.tsx', [
  ['import { formatDate } from "@/lib/utils";', 'import { formatDate, safeJson } from "@/lib/utils";'],
  ['const data = await res.json();\n      setGrns(data.grns || []);', 'const data = await safeJson<any>(res);\n      setGrns(data.grns || []);'],
  ['const data = await res.json();\n      if (!res.ok) throw new Error(data.error || "Failed to delete GRN");', 'const data = await safeJson<any>(res);\n      if (!res.ok) throw new Error(data.error || "Failed to delete GRN");'],
]);

// purchase-orders page
patchFile('purchase-orders\\page.tsx', [
  ['import { formatCurrency, formatDate } from "@/lib/utils";', 'import { formatCurrency, formatDate, safeJson, ensureOk } from "@/lib/utils";'],
]);

console.log('done');
