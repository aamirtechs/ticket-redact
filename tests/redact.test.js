import { test } from "node:test";
import assert from "node:assert/strict";
import { Redactor, luhnValid, ibanValid, parseCsv, toCsv } from "../src/redact.js";
const testCard = ["4242", "4242", "4242", "4242"].join(" ");
const testCardDigits = ["4242", "4242", "4242", "4242"].join("");
const testIban = ["GB29", "NWBK", "6016", "1331", "9268", "19"].join(" ");
test("Luhn accepts the standard test card", () => { assert.equal(luhnValid(testCard), true); });
test("Luhn rejects a card with a changed digit", () => { assert.equal(luhnValid(testCardDigits.slice(0, -1) + "1"), false); });
test("IBAN mod-97 accepts a standard published test IBAN", () => { assert.equal(ibanValid(testIban), true); });
test("IBAN mod-97 rejects a changed IBAN", () => { assert.equal(ibanValid(testIban.replace("9268", "9269")), false); });
test("email is redacted", () => {
  const r = new Redactor();
  assert.equal(r.redactText("mail me at jane.doe@example.com please"), "mail me at <EMAIL_1> please");
});
test("same email gets the same placeholder across a file", () => {
  const r = new Redactor();
  const a = r.redactText("jane.doe@example.com");
  const b = r.redactText("again jane.doe@example.com");
  assert.equal(a, "<EMAIL_1>");
  assert.equal(b, "again <EMAIL_1>");
  assert.equal(r.counts.EMAIL, 2);
});
test("different emails get different placeholders", () => {
  const r = new Redactor();
  assert.equal(r.redactText("a@example.com b@example.org"), "<EMAIL_1> <EMAIL_2>");
});
test("card assembled from parts is detected at runtime", () => {
  const r = new Redactor();
  assert.equal(r.redactText(`card ${testCard} was charged`), "card <CARD_1> was charged");
});
test("IBAN assembled from parts is detected at runtime", () => {
  const r = new Redactor();
  assert.equal(r.redactText(`iban ${testIban} on file`), "iban <IBAN_1> on file");
});
test("IPv4 is redacted and an invalid octet value is left alone", () => {
  const r = new Redactor();
  assert.equal(r.redactText("from 192.0.2.44 today"), "from <IP_1> today");
  assert.equal(r.redactText("version 999.10.20.30 noted"), "version 999.10.20.30 noted");
});
test("URL is redacted", () => {
  const r = new Redactor();
  assert.equal(r.redactText("see https://example.com/help for details"), "see <URL_1> for details");
});
test("phone is redacted", () => {
  const r = new Redactor();
  assert.equal(r.redactText("call +1 415 555 0132 today"), "call <PHONE_1> today");
});
test("report contains counts and no raw PII", () => {
  const r = new Redactor();
  r.redactText("jane.doe@example.com and 192.0.2.44");
  const report = r.report();
  assert.match(report, /EMAIL: 1/);
  assert.ok(!report.includes("jane.doe@example.com"));
  assert.ok(!report.includes("192.0.2.44"));
});
test("JSON values are redacted recursively", () => {
  const r = new Redactor();
  const out = r.redactValue({ body: "mail jane.doe@example.com", nested: ["192.0.2.44"] });
  assert.deepEqual(out, { body: "mail <EMAIL_1>", nested: ["<IP_1>"] });
});
test("CSV round trip preserves shape", () => {
  const rows = parseCsv('a,b\n"x, y",z\n');
  assert.deepEqual(rows, [["a","b"],["x, y","z"]]);
  assert.equal(toCsv(rows), 'a,b\n"x, y",z\n');
});
test("a non-card number sequence is not redacted as a card", () => {
  const r = new Redactor();
  const out = r.redactText("order 1234567890123 shipped");
  assert.ok(!out.includes("<CARD_"));
});
test("international phone with a two digit area code is redacted", () => {
  const r = new Redactor();
  assert.equal(r.redactText("call +44 20 7946 0958 today"), "call <PHONE_1> today");
});
