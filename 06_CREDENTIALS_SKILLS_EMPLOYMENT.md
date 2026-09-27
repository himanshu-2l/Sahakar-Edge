# Credentials, Skills and Employment

## Principle

Training should produce evidence, not just a PDF certificate.

## Evidence chain

``` text
Course
→ Assessment
→ Completion rule
→ Skill evidence
→ Credential
→ Skill profile
→ Opportunity matching
```

## Credential MVP

Create a canonical credential payload containing: - credential ID -
issuer - trainee ID/display name as policy permits - programme -
skills/evidence summary - issue time - expiry nullable - schema version

Sign canonical payload using Ed25519 abstraction.

QR may contain: - compact signed payload if small enough, OR -
credential ID + signature/verifier route for online verification.

Provide: - credential view - QR - verification page -
valid/revoked/unknown result

Do not claim that signed QR credentials are novel.

## Skills

Start with a small cooperative-domain taxonomy seeded manually from
project research and demo use cases.

Each skill must have: - stable code - name - description -
parent/category - evidence rule

## Job matching MVP

Use transparent scoring:

1.  hard eligibility filters
2.  weighted overlap of verified skills
3.  optional semantic similarity only as secondary signal
4.  return matched and missing skills

Example output: - Matched: PACS accounting, voucher entry - Missing: 1
year field experience

Never show fake probability such as "94% employable".

## Validation

Create expert-labelled demo pairs and compare: - keyword baseline -
weighted skill overlap - optional embeddings

Metrics if enough labels exist: - Precision@K - Recall@K - nDCG
