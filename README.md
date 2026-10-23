# ticket-redact
Live page: https://aamirtechs.github.io/ticket-redact/

Offline CLI that strips PII (emails, phone numbers, credit cards, IBANs, IPs, URLs) from exported support tickets and chat transcripts, with consistent placeholders across a file and a redaction report that never prints raw PII. Safe exports for QA, training and AI tools.

## Why

Support exports are useful for QA, training, and AI tools, but they are full of customer emails, phone numbers, payment details, and bank identifiers. This tool redacts them locally, with no network calls and no dependencies, so a file can be made safe to share without sending it to a third party service first.

## Install

Requires Node.js 20 or later. No dependencies to install.

```bash
git clone <your fork or copy of this repo>
cd ticket-redact
```

## Usage

```bash
node src/cli.js examples/tickets.csv redacted.csv --report report.md
node src/cli.js examples/tickets.json redacted.json --report report.md
```

Input and output formats are chosen by file extension, `.csv` or `.json`. The same value always becomes the same placeholder within one run, for example the first distinct email becomes `<EMAIL_1>` everywhere it appears. That consistency keeps threads readable and makes it possible to follow one customer across tickets without seeing their address.

The report contains counts by type only. It never prints raw values.

Library use:

```js
import { Redactor } from "./src/index.js";

const redactor = new Redactor();
console.log(redactor.redactText("Mail me at jane.doe@example.com"));
console.log(redactor.report());
```

## Detectors

- Email addresses.
- Phone numbers, international style patterns including country codes.
- Credit cards, validated with the Luhn check so random order numbers are left alone.
- IBANs, validated with the mod-97 check.
- IPv4 addresses, with octet range validation.
- URLs starting with http or https.

## Example

Input, from `examples/tickets.csv`. All values are synthetic, use example.com addresses and published test payment values written with spaces:

```csv
id,subject,body
1,Login help,Hi I am Jane and my email is jane.doe@example.com and I cannot log in from 192.0.2.44
2,Refund question,Please refund the charge on my card 4242 4242 4242 4242 and call me on +1 415 555 0132
3,Bank transfer,My IBAN is GB29 NWBK 6016 1331 9268 19 and my profile is https://example.com/users/jane
4,Follow up,Same email jane.doe@example.com here. The first ticket was from 192.0.2.44 too
```

Real output captured by running the CSV command above:

```text
Redacted 8 values. Wrote /tmp/out2/tickets-redacted.csv
Wrote /tmp/out2/report.md
```

Note: the paths above are the temporary output paths used when capturing this README example. Your paths will match the arguments you pass.

Real redacted output:

```csv
id,subject,body
1,Login help,Hi I am Jane and my email is <EMAIL_1> and I cannot log in from <IP_1>
2,Refund question,Please refund the charge on my card <CARD_1> and call me on <PHONE_1>
3,Bank transfer,My IBAN is <IBAN_1> and my profile is <URL_1>
4,Follow up,Same email <EMAIL_1> here. The first ticket was from <IP_1> too
```

Real report output:

```markdown
# Redaction Report

Counts by type:
- URL: 1
- EMAIL: 2
- IBAN: 1
- CARD: 1
- IP: 2
- PHONE: 1

Total redactions: 8

This report contains counts only. No raw values are included.
```

Real JSON output for `examples/tickets.json`:

```json
[
  {
    "id": 1,
    "subject": "Cannot access account",
    "body": "Contact me at <EMAIL_1> or on <PHONE_1>. I was browsing from <IP_1>."
  },
  {
    "id": 2,
    "subject": "Payment failed",
    "body": "The page at <URL_1> failed and my email is <EMAIL_1>."
  }
]
```

## Tests

```bash
npm test
```

Test card and IBAN values in the test suite are standard published test values assembled from string parts at runtime, so no complete payment value sits in the source.

## License

MIT, see LICENSE.
