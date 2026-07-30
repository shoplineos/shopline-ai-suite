---
name: shopline-storefront-graphql
description: Use for retrieving SHOPLINE Storefront GraphQL documentation and generating verified Storefront GraphQL queries or mutations for customer-facing website development.
metadata:
  version: '1.0.0'
---

# SHOPLINE Storefront GraphQL

## About This Skill

This Skill is intended for SHOPLINE Storefront GraphQL development scenarios.
It is used to search Storefront GraphQL queries, mutations, types, fields, arguments, and enums, and to validate generated results.

Its core goals are:

- Search Storefront GraphQL documentation before answering
- Generate the smallest possible correct GraphQL operation based on search results
- Run local validation before returning, reducing the risk of inventing fields, arguments, types, and enum values

This Skill is positioned as a "Storefront GraphQL-specific retrieval and generation skill." It is not a general SHOPLINE development skill and not a frontend component generation skill.

## What This Skill Provides

This Skill provides the following capabilities:

- Search `shopline-storefront-graphql` documentation
- Generate Storefront GraphQL queries or mutations
- Validate and fix GraphQL operations based on local documentation assets
- Provide evidence-based results for version-sensitive Storefront GraphQL questions

Suitable topics include, but are not limited to:

- Product, collection, variant, and search-related queries
- Cart mutations such as cart, buyer identity, and discount codes
- Types such as `Product`, `Collection`, `Cart`, `CartLine`, and `MoneyV2`
- Looking up and confirming fields, arguments, input objects, and enum values
- Fixing GraphQL errors, such as missing fields, incorrect argument types, or missing required arguments

## When to Use

Trigger `shopline-storefront-graphql` when the request matches the following conditions:

- The user explicitly asks about SHOPLINE Storefront GraphQL
- A Storefront GraphQL query or mutation needs to be generated or fixed
- A Storefront GraphQL type, field, argument, or enum needs to be queried
- The question depends on current documentation or schema and cannot rely only on the model's existing memory
- Static validation of the GraphQL operation is needed before returning

Typical examples:

- "Help me write a Storefront GraphQL query for product details"
- "How should the cartCreate mutation be written?"
- "Does `Product` have a `variants` field?"
- "How do I fix this Storefront GraphQL error?"
- "Query the field definition of `CartLineInput`"

## When Not to Use

Do not use `shopline-storefront-graphql` in the following scenarios:

- SHOPLINE Admin GraphQL questions
- SHOPLINE Admin REST API questions
- Webhook, OAuth, CLI, app review, or other topics that are not Storefront GraphQL
- Theme templates, Handlebars, Sline, Themes 3.0, or Ajax API questions
- Pure frontend UI, page layout, or component styling questions
- General conceptual explanations that do not require search and validation

If the request actually belongs to another narrower or more suitable skill, use the corresponding skill first instead of continuing with this Skill.

## Required Workflow

1. First extract the operation name, resource name, type name, or field name from the user's request.
2. Before answering, you must first run `scripts/search_docs.mjs`.
3. Generate GraphQL operations only based on search results; do not rely only on memory.
4. After generating a result, you must run `scripts/validate_gql.mjs`.
5. If validation fails, you must fix it based on the error message and search again for the relevant type, field, or argument.
6. Retry at most 3 times; if it still fails after 3 attempts, return the current best result and explicitly state the risk.
7. If search or validation is unavailable, you may only provide a best-effort result and must explicitly state that validation was not completed.

## Output Constraints

- Do not invent queries, mutations, fields, arguments, input objects, enum values, or return types.
- Do not return an unvalidated GraphQL operation while pretending it has been "verified."
- GraphQL operations should preferably remain minimal and include only the fields necessary to complete the user's goal.
- Keep GraphQL names, field names, argument names, type names, enum values, and code identifiers in their original English.
- If search results are insufficient to support the conclusion, you must explicitly state what information is missing.
- If validation is skipped, fails, or is unavailable, you must explicitly write a risk warning.
- If multiple viable operations exist for the same goal, prefer the most direct, smallest option that best fits the Storefront scenario.

## Mandatory Search

You must search before answering:

```bash
node scripts/search_docs.mjs "<operation or type name>"
```

When searching, use operation names, type names, field names, or resource names instead of passing the entire natural-language request verbatim.

Recommended examples:

- `cartCreate`
- `product query`
- `Product`
- `ProductVariant`
- `CartLineInput`
- `predictiveSearch`

It is not recommended to use the entire user question verbatim as the query.

## Mandatory Validation

After generating a GraphQL operation, you must validate it:

```bash
node scripts/validate_gql.mjs --code 'query { ... }'
```

If validation fails, you must run the following loop:

1. First read the error message and identify the specific failure point.
2. If the error involves a type, field, argument, or enum, rerun `scripts/search_docs.mjs` to search for the relevant content.
3. Fix only confirmed errors; do not guess other fields or parameters.
4. Run `scripts/validate_gql.mjs` again.
5. Retry at most 3 times.

Unless validation passes, do not treat the result as the final correct answer.

## Failure Handling

When any of the following occurs, you must proactively degrade and explain the boundaries:

- Local assets are missing
- The search script is unavailable
- The validation script is unavailable
- The schema required for validation is incomplete
- Search results and validation results are insufficient to support a unique conclusion

In this case, you may only provide a best-effort result and must explicitly state which step was not completed and where the risk is.

Do not mistake "the script ran successfully" for "the GraphQL is definitely correct."
