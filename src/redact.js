export function luhnValid(input) {
  const digits = String(input).replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0, dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}
export function ibanValid(input) {
  const iban = String(input).replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of code) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}
export class Redactor {
  constructor() {
    this.maps = { URL: new Map(), EMAIL: new Map(), IBAN: new Map(), CARD: new Map(), IP: new Map(), PHONE: new Map() };
    this.counts = { URL: 0, EMAIL: 0, IBAN: 0, CARD: 0, IP: 0, PHONE: 0 };
  }
  placeholder(type, raw) {
    const key = raw.replace(/\s/g, " ").trim();
    if (!this.maps[type].has(key)) this.maps[type].set(key, `<${type}_${this.maps[type].size + 1}>`);
    this.counts[type]++;
    return this.maps[type].get(key);
  }
  redactText(text) {
    if (typeof text !== "string") return text;
    let out = text;
    out = out.replace(/https?:\/\/[^\s<>"')\]]+/gi, m => this.placeholder("URL", m));
    out = out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, m => this.placeholder("EMAIL", m));
    out = out.replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g, m => ibanValid(m) ? this.placeholder("IBAN", m.replace(/\s/g, "")) : m);
    out = out.replace(/\b(?:\d[ -]?){12,18}\d\b/g, m => luhnValid(m) ? this.placeholder("CARD", m.replace(/[\s-]/g, "")) : m);
    out = out.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, m => m.split(".").every(p => Number(p) <= 255) ? this.placeholder("IP", m) : m);
    out = out.replace(/\+\d{1,3}[\s.-]?(?:\d{2,4}[\s.-]?){2}\d{2,4}\b|(?:\(\d{3}\)[\s.-]?|\d{3}[\s.-])\d{3,4}[\s.-]?\d{4}\b/g, m => {
      const digits = m.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) return m;
      return this.placeholder("PHONE", m);
    });
    return out;
  }
  redactValue(value) {
    if (typeof value === "string") return this.redactText(value);
    if (Array.isArray(value)) return value.map(v => this.redactValue(v));
    if (value && typeof value === "object") {
      const obj = {};
      for (const [k, v] of Object.entries(value)) obj[k] = this.redactValue(v);
      return obj;
    }
    return value;
  }
  report() {
    const lines = ["# Redaction Report", "", "Counts by type:"];
    let total = 0;
    for (const [type, count] of Object.entries(this.counts)) { if (count) lines.push(`- ${type}: ${count}`); total += count; }
    if (!total) lines.push("- none: 0");
    lines.push("", `Total redactions: ${total}`, "", "This report contains counts only. No raw values are included.", "");
    return lines.join("\n");
  }
}
export function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
export function toCsv(rows) {
  return rows.map(r => r.map(v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s; }).join(",")).join("\n") + "\n";
}
