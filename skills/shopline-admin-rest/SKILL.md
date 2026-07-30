---
name: shopline-admin-rest
description: Search SHOPLINE Admin REST API endpoints. Use when the user asks about Admin REST paths, methods, parameters, requests and responses, or status codes; search is required before answering, and detail lookup is required before returning precise information.
metadata:
  version: '1.0.0'
---

## About This Skill

This skill is dedicated to retrieving and verifying SHOPLINE Admin REST API endpoints. It depends on the local OAS assets and scripts in this directory. It is not responsible for general documentation Q&A, nor for GraphQL, themes, Webhooks, OAuth, or app review questions.

## When to Use

Use `shopline-admin-rest` in the following scenarios:

- The user is explicitly asking about the SHOPLINE Admin REST API
- You need to locate the path or HTTP method of a REST endpoint
- You need to confirm query/path/header parameters, request body, response body, response headers, status code, or security
- You need to search for an Admin REST endpoint by resource name, action name, or path fragment
- The question depends on OAS documentation verification and cannot rely only on model memory

Typical requests:

- "How do I query carrier services in Admin REST?"
- "What is the REST endpoint for creating a product?"
- "What parameters does `GET /carrier_services.json` have?"
- "How is this endpoint's request body defined?"
- "What response headers does this API return?"

## When Not to Use

Do not use `shopline-admin-rest` in the following scenarios:

- SHOPLINE Admin GraphQL or Storefront GraphQL
- Webhook, OAuth, CLI, app review, or other topics that are not Admin REST endpoints
- Theme templates, Handlebars, Sline, Themes, Ajax API
- Merchant admin operations, business operations questions, or non-technical consulting
- General SHOPLINE documentation search that does not involve an Admin REST endpoint

If the request is better suited to another skill, switch to that skill first. Fall back to `shopline-dev` for general SHOPLINE development questions.

## Hard Rules

1. Before answering any Admin REST question, first extract the resource name, action name, path, HTTP method, or parameter keywords.
2. Before answering, you must run `scripts/search_rest.mjs`; do not answer only from memory.
3. Whenever you need to return an exact path, method, parameter, request body, response body, response headers, status code, or security value, you must run `scripts/get_rest_detail.mjs`.
4. If the user provides a complete API path, a complete URL, or a path with the `/admin/openapi/<version>` prefix, first normalize it to an OAS endpoint path and preserve the version. For example, `/admin/openapi/v20260901/orders.json` must be called as `--path /orders.json --version v20260901`.
5. Search results are only for locating candidate endpoints and are not enough to support full schema conclusions.
6. If there are multiple candidate endpoints, you must continue narrowing the scope or explicitly state the ambiguity.
7. If the detail result is not enough to support the conclusion, you must explicitly state what is missing.
8. If scripts or assets are unavailable, you may only provide a best-effort result and must explicitly state the unverified risk.

## Required Workflow

### 1) Search First

First search for candidate endpoints. The search term should be a resource name, action name, path fragment, or method. Do not pass the entire natural-language request verbatim.

Recommended search terms:

- `carrier services`
- `create product`
- `orders fulfillment`
- `/products.json`
- `inventory levels`

Common commands:

```bash
scripts/search_rest.mjs "<resource, action, or path>" --limit 5
scripts/search_rest.mjs "<resource or action>" --methods GET,POST --limit 5
scripts/search_rest.mjs "<resource or action>" --methods GET --limit 5 --json
scripts/search_rest.mjs "<resource or action>" --version v20260901 --limit 5 --json
```

Supported parameters:

- `--methods <list>`: comma-separated HTTP methods, such as `GET,POST`
- `--limit <number>`: limit the number of results; default is 10
- `--version <version>`: load a specific bundled OAS version, such as `v20260901`
- `--domain <url>`: override the documentation resource domain
- `--oas-file <path>`: read from a local JSON or gzip OAS file
- `--json`: output JSON

### 2) Detail Before Precision

If precise information needs to be returned, endpoint detail must be queried. Only detail results can support answers at the level of parameters, schemas, response structures, and status codes.

The value passed to `--path` must be the OAS endpoint path, not the complete API-prefixed path or a complete URL.

Normalization example:

- User input: `/admin/openapi/v20260901/orders.json`
- Use when calling detail: `--path /orders.json --version v20260901`

Common commands:

```bash
scripts/get_rest_detail.mjs --path "<endpoint path>" --method <HTTP_METHOD>
scripts/get_rest_detail.mjs --path "<endpoint path>" --method <HTTP_METHOD> --json
scripts/get_rest_detail.mjs --path "/orders.json" --method GET --version v20260901 --json
scripts/get_rest_detail.mjs --oas-file <path-to-oas.json-or-json.gz> --path "<endpoint path>" --method <HTTP_METHOD> --json
```

Supported parameters:

- `--path <path>`: REST endpoint path
- `--method <method>`: HTTP method
- `--sections <list>`: comma-separated detail sections; allowed values are `pathParameters`, `queryParameters`, `headerParameters`, `requestBody`, `responseBody`, and `responseHeaders`
- `--version <version>`: load a specific bundled OAS version, such as `v20260901`
- `--domain <url>`: override the documentation resource domain
- `--oas-file <path>`: read from a local JSON or gzip OAS file
- `--json`: output JSON

If the user has already provided a clear path and method, you may query detail directly first; if detail fails, then run search to confirm candidate endpoints.

## Failure Handling

When any of the following occurs, proactively degrade and explain the boundaries:

- Local OAS asset is missing
- `search_rest.mjs` is unavailable
- `get_rest_detail.mjs` is unavailable
- Search results are empty, too many candidates are returned, or the endpoint cannot be uniquely identified
- The path exists, but the specified method does not
- The detail result is missing the parameter, schema, response, header, or status code the user cares about
- Script dependencies are missing, such as `flexsearch` or `fuzzball`

When degrading, you must explain:

- Which step was not completed
- Which conclusions have been verified and which have not
- Where the risk is

Do not describe "search succeeded" as "detail has been verified."

## Output Rules

- Do not invent endpoint paths, HTTP methods, parameters, request bodies, response bodies, response headers, status codes, security requirements, or schema names.
- Keep paths, HTTP methods, parameter names, schema names, enum values, header names, and code identifiers in their original English.
- If the user does not specify a version, prefer the OAS assets bundled with this skill, but do not claim that they are necessarily the latest stable version.
- If search results are not enough to support a unique conclusion, you must provide candidates or explicitly state the ambiguity.
- If detail is skipped, fails, or is unavailable, you must explicitly write a risk warning.
- If multiple viable endpoints exist, prefer the most direct, smallest, and most Admin REST-appropriate option, and explain the basis.
