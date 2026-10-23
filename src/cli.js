#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { Redactor, parseCsv, toCsv } from "./redact.js";
function usage() { console.error("Usage: ticket-redact <input.csv|input.json> <output.csv|output.json> [--report FILE]"); }
const args = process.argv.slice(2);
if (args.length < 2) { usage(); process.exit(2); }
const [input, output] = args;
let reportFile = null;
for (let i = 2; i < args.length; i++) {
  if (args[i] === "--report") reportFile = args[++i] || "redaction-report.md";
  else { usage(); process.exit(2); }
}
const text = readFileSync(input, "utf8");
const redactor = new Redactor();
const ext = extname(input).toLowerCase();
if (ext === ".json") {
  const data = JSON.parse(text);
  writeFileSync(output, JSON.stringify(redactor.redactValue(data), null, 2) + "\n");
} else if (ext === ".csv") {
  const rows = parseCsv(text);
  const outRows = rows.map(r => r.map(c => redactor.redactText(c)));
  writeFileSync(output, toCsv(outRows));
} else { console.error("Input must be .csv or .json"); process.exit(2); }
if (reportFile) writeFileSync(reportFile, redactor.report());
const total = Object.values(redactor.counts).reduce((a,b)=>a+b,0);
console.log(`Redacted ${total} values. Wrote ${output}`);
if (reportFile) console.log(`Wrote ${reportFile}`);
