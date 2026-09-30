# Schemas

`seed.schema.json` is Draft07 for the bounded TMT-04 adaptation contract.
`tools/data/validate.mjs` interprets the used keywords and additionally enforces
references, approved rules, provenance hashes, ordered types and premade legality.
Schema shape permits null species types to represent incomplete input; semantic
validation always rejects them. Full catalog/runtime mechanics are out of scope.
