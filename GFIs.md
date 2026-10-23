# Good First Issues

## 1. Add LiveChat transcript JSON preset

LiveChat exports have a specific nested transcript shape that users currently have to reshape by hand. Add a preset that recognises that shape and redacts visitor and agent message text plus visitor contact fields. Keep the same placeholder and report behaviour as the generic JSON path.

## 2. Add custom deny-list words file

Support teams often need to remove internal project names, hostnames, or customer account names that generic detectors miss. Add a flag that reads a plain text deny-list, one term per line, and replaces matches with a consistent placeholder type. Document the matching rules and add tests for repeated terms.

## 3. Add --mask mode (show last 4) alongside the default --replace mode

For some QA workflows a masked value that keeps the last four characters is more useful than a full placeholder. Add a mask mode for cards, phones, and IBANs while keeping replace as the default. Make sure the report and consistency rules are documented for both modes.
