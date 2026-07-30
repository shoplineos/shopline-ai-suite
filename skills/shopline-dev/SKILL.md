---
name: shopline-dev
description: Use for searching SHOPLINE developer documentation, especially when no more specialized SHOPLINE skill is a precise match.
metadata:
  version: '1.0.0'
---

# General SHOPLINE Developer Documentation Search

This instruction draft defines `shopline-dev`, a general-purpose SHOPLINE developer documentation search skill.
Its responsibility is to handle questions that fall within the scope of SHOPLINE developer platform knowledge but are not clearly covered by a more specialized skill.

The core positioning of this skill is a "general search entry point," not an "all-purpose development expert."

## About This Skill

This Skill is intended for SHOPLINE developer documentation retrieval scenarios and provides a unified, lightweight, controlled search entry point.

Its main goals are:

- Retrieve current SHOPLINE developer documentation before answering
- Provide the model with document context it can rely on
- Reduce the risk of inventing APIs, fields, types, commands, or rules

## What This Skill Provides

This Skill provides the following capabilities:

- General search across SHOPLINE development topics
- A fallback skill for general development questions
- Current documentation support for answers when no more specialized skill clearly matches

The knowledge topics it is suitable for include, but are not limited to:

- REST Admin API
- GraphQL Admin API
- Storefront API
- Webhooks
- OAuth and app authentication
- CLI and development tools
- Theme development, including Handlebars, Sline, Themes 3.0, and Ajax API
- App review, platform constraints, and version-sensitive development rules

## When to Use

Trigger `shopline-dev` when the user's request matches the following conditions:

- The question belongs to the SHOPLINE developer platform scope
- Current official documentation needs to be queried instead of relying only on the model's existing memory
- The request may span multiple development topics
- No narrower, more explicit SHOPLINE skill is currently available

Typical examples:

- "What is the SHOPLINE OAuth authorization flow?"
- "Query the header and retry mechanism for product webhooks"
- "How is a certain mutation defined in the GraphQL Admin API?"
- "What are the capability boundaries between Themes 2.0 and Sline?"
- "Does app review require GDPR webhooks?"

## When Not to Use

Do not use `shopline-dev` in the following scenarios:

- Pure merchant operations or admin backend operation questions
- Non-technical help or consulting
- Requests that should clearly be handled by a more specialized skill

If the request can already be clearly matched by more specialized skills such as `shopline-admin-rest`, `shopline-admin-graphql`, or `shopline-storefront-graphql`, do not continue using `shopline-dev`.

## Required Workflow

1. First extract topic terms or feature names from the user's request.
2. Before answering, you must run `scripts/search_docs.mjs`.
3. The answer must be based on search results, not only on memory.
4. If the search results are insufficient to support the conclusion, you must explicitly state what information is missing.
5. If search capability is unavailable, you may only provide a best-effort result and must explicitly state the risk boundaries.

## Output Constraints

- Do not invent endpoints, fields, types, webhook topics, header names, CLI parameters, or platform rules.
- Keep API names, field names, enum values, commands, and code identifiers in their original English.
- If the user does not specify a version, prefer documentation returned by the configured or default documentation search domain.
- If the answer did not actually complete a search, you must explicitly state that instead of pretending the conclusion has been verified.

## Mandatory Search

You must search before answering:

```bash
node scripts/search_docs.mjs "<topic or feature name>"
node scripts/search_docs.mjs "<topic or feature name>" --max-results 5 --json
```

Supported parameters:

- `--max-results <number>`: limit the number of returned documentation results
- `--json`: output raw JSON

When searching, use topic terms or feature names instead of passing the entire natural-language user request verbatim.

For example, these are more recommended:

- `oauth`
- `product webhook`
- `GraphQL productCreate`
- `theme app extension`

Instead of directly passing the entire natural-language question into search.
