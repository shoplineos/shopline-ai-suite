---
name: shopline-theme-development
description: Use this skill to build, debug, refactor, and validate SHOPLINE themes and SLine templates. Trigger when a task involves SHOPLINE theme structure, `sections/`, `blocks/`, `components/`, `templates/`, `layout/`, `public/`, `i18n/`, `theme.schema.json`, `theme.config.json`, theme editor schema, SLine tags, SLine objects, SLine filters, or basic theme development workflow.
---

# Your Task

You are an experienced SHOPLINE theme developer. Implement user requests by generating, modifying, debugging, and validating theme code that is consistent with the "Theme Architecture", "SLine Syntax", and "Basic Workflow" below.

Keep this skill lean. For API references, detailed guides, editor setting definitions, runtime APIs, CLI command details, theme app extension rules, SEO, i18n, performance, or platform-specific behavior, search the current documentation with the bundled `scripts/search_docs.mjs` script on demand.

## Documentation Search

**Key principle: do not embed API or guide documentation in this skill. Search it when needed.**

Run the search command from the skill root:

```bash
node scripts/search_docs.mjs "<tag, object, filter, or focused topic>"
```

Use the `--help` option to view the script's command syntax and supported options:

```bash
node scripts/search_docs.mjs --help
```

- Extract the relevant tag, object, filter, schema setting, API name, or theme topic from the user's request before searching.
- Use focused identifiers or short topic phrases instead of passing the entire natural-language request verbatim. Search one topic at a time when possible.
- Use `--max-results <number>` to limit the result count and `--json` when raw structured output is useful.
- Search whenever a task requires SLine `object`, `tag`, or `filter` details, including behavior, parameters, examples, return values, or edge cases.
- Search for SHOPLINE theme development questions involving theme directory responsibilities, templates, layouts, sections, blocks, components, theme editor schema/settings, i18n, assets, CLI workflow, runtime APIs, SEO, performance, or theme app extension behavior.
- Search before using unfamiliar or task-critical SLine tags, objects, filters, schema settings, theme editor behavior, CLI commands, runtime APIs, or theme app extension capabilities.
- If search results conflict with existing theme code, prefer documented behavior first, then reconcile with local patterns.
- If the script is unavailable, fails, or does not provide the needed detail, inspect nearby theme files, clearly state the assumption, and disclose that documentation search was incomplete.

## Theme Architecture

**Key principles: build small reusable theme units; place editable merchant-facing UI in sections or blocks; keep non-editable reusable markup in components.**

### Directory Structure

```text
.
├── blocks              # Reusable, nestable, merchant-configurable blocks
├── components          # Reusable SLine/HTML fragments without independent editor configuration
├── i18n                # Storefront and editor translation JSON files
├── layout              # Top-level page shells
├── public              # Static assets such as CSS, JavaScript, images, and fonts
├── sections            # Merchant-configurable page modules
├── templates           # Page templates that compose layouts, sections, and blocks
├── theme.config.json   # Current theme settings, presets, and fixed component data
└── theme.schema.json   # Theme metadata and global setting definitions
```

### `layout`

- Define the page shell and global frame.
- Keep required page placeholders intact when editing layout files.
- Use layout files for repeated global structure such as document scaffolding, header placement, footer placement, and shared resource loading.

### `templates`

- Use JSON templates for merchant-configurable page composition.
- Use HTML templates for fixed page markup.
- Keep template references, section IDs, section order, block IDs, and block order consistent.

### `sections`

- Use sections for full page modules or independently configurable page areas.
- Keep each section's render logic, schema settings, presets, and i18n labels aligned.
- Add blocks to a section only when merchants need to add, remove, reorder, or configure repeated content.

### `blocks`

- Use blocks for reusable merchant-configurable units.
- Use root-level `blocks/` for shared blocks and section-local `sections/<section>/blocks/` for private blocks.
- Keep block settings, nested block structure, and render logic consistent.

### `components`

- Use components for reusable markup or logic that does not need independent editor configuration.
- Pass data explicitly through component parameters or props.
- Do not use components as a replacement for merchant-configurable sections or blocks.

### `i18n`

- Store user-facing copy and editor labels in translation files instead of hardcoding repeated strings.
- Keep translation keys synchronized with schema labels, storefront copy, and template usage.

### `public`

- Store static assets that the theme needs at runtime.
- Keep component-specific CSS and JavaScript close to the related section, block, or component when the theme pattern supports it.
- When adding or rewriting theme JavaScript, prefer Web Components/custom elements for interactive behavior, while still matching the existing theme's JavaScript organization and conventions.

### `theme.schema.json` and `theme.config.json`

- Use `theme.schema.json` for global setting definitions and theme metadata.
- Use `theme.config.json` for preset data, current setting values, and fixed component configuration.
- When changing global settings, update both the schema definition and the places that read the setting.

## SLine Syntax

**Key principles: use SLine for data output, control flow, composition, filtering, and schema definition. Tags and filters are internally implemented by SHOPLINE and cannot be custom-registered. Search exact tag/object/filter documentation with `scripts/search_docs.mjs` when behavior matters.**

### Output and Escaping

```sline
{{ page_title }}
{{ product.title }}
{{{ product.description }}}
```

- Use `{{ expression }}` to output objects, properties, and expressions with normal escaping.
- Use `{{{ expression }}}` only when raw, unescaped HTML output is required.
- Read nested properties with dot notation, such as `product.title` or `section.settings.heading`.

### Tags

```sline
{{#if customer != nil}}
  User {{ customer.name }} is logged in.
{{#else/}}
  User is anonymous.
{{/if}}

{{#product_form /}}
```

- Use normal tags as `{{#tag_name ...}} ... {{/tag_name}}`.
- Use self-closing tags as `{{#tag_name ... /}}`.
- Tags define template logic and do not output visible text by themselves.

### Filters

```sline
{{ page_description | truncate(150) }}
{{ product.price | money() }}
{{ product.featured_image | image_url() }}
```

- Use filters to modify output values.
- Add filters inside `{{ }}` expressions or inside tag arguments after `|`.
- Chain multiple filters from left to right.
- Use the documented `filter_name(args)` call shape; confirm task-critical signatures with `scripts/search_docs.mjs`.

### Handles and Property Access

```sline
{{ product.handle }}
{{ linklists["header"].title }}
{{ linklists.header.title }}
```

- Resource handles identify store resources and are commonly available on products, collections, articles, blogs, linklists, and links.
- Use bracket notation when the handle is a string or variable.
- Use dot notation when the handle is a literal property-safe name.
- Remember that settings from `theme.config.json`, sections, or blocks often use their `id` as a handle-like key.

### Operators and Conditions

```sline
{{#if product.price >= 30 && product.available}}
  Available product over threshold.
{{/if}}

{{#if true && (true || false)}}
  Parentheses can make precedence explicit.
{{/if}}
```

- Supported comparison operators: `==`, `!=`, `>`, `<`, `>=`, `<=`.
- Supported logical operators: `&&` and `||`.
- `&&` has higher precedence than `||`; use parentheses when priority should be explicit.
- In conditions, only `false` and `nil` are falsy. Empty strings, zero, arrays, and empty arrays are truthy.

### Types

- Strings can use double quotes, single quotes, or backticks.
- Numbers include integers and floats.
- Booleans are `true` or `false`.
- `nil` represents an undefined value and outputs nothing.
- Arrays are traversed with `for`; access array items with zero-based bracket notation.
- SLine does not initialize arrays directly from literals; use documented filters such as `split()` when an array must be derived from a string.

### Loops

```sline
{{#for tag in product.tags}}
  {{ forloop.index }}: {{ tag }}
{{/for}}
```

- Use `for` to render each item in an array.
- Use the local `forloop` object for loop metadata.
- Use `size()` when checking whether an array has items because empty arrays are still truthy.

### Whitespace Control

```sline
start
{{~ "content" ~}}
end
```

- Add `~` next to braces to trim surrounding spaces, newlines, tabs, and other whitespace.
- Use whitespace trimming only when the rendered HTML actually needs it.

### Composition

```sline
{{#component "product/card" product=product /}}
```

- Use components for reusable snippets of markup or logic.
- Pass non-global values explicitly through hash parameters; read them from `props` inside the component.
- Keep section, block, and component responsibilities distinct.

### Schema Blocks

```sline
{{#schema}}
{
  "name": "Example section",
  "settings": []
}
{{/schema}}
```

- Use schema blocks to expose section or block configuration to the theme editor.
- Keep schema JSON valid.
- Keep schema setting IDs synchronized with render-time reads.
- Search current setting types, required fields, and editor behavior with `scripts/search_docs.mjs` before adding unfamiliar controls.

## Basic Workflow

1. Classify the task as structure, rendering, editor configuration, SLine syntax/API usage, i18n, assets, CLI workflow, or validation.
2. Inspect the smallest relevant set of local theme files before editing.
3. For SLine object/tag/filter details or SHOPLINE theme development questions, run `node scripts/search_docs.mjs "<focused query>"` before implementation; otherwise search only when the task needs current documentation.
4. Follow the existing theme's naming, file organization, schema style, CSS style, and JavaScript style.
5. Keep changes scoped to the requested behavior and its required schema, template, translation, and asset updates.
6. Validate changed SLine, JSON, and theme structure before final delivery.

## Validation

- Validate changed JSON with the repository's existing formatter, linter, or parser when available.
- Run targeted syntax validation for changed SLine files with `scripts/validate-syntax.mjs` when available. From the skill root's `scripts` directory, use:

```bash
node validate-syntax.mjs check /absolute/path/to/file.html
```

- For editor-facing changes, verify that schema IDs, setting reads, presets, template references, and i18n keys match.
- In the final response, state which validation was run. If validation was not run, state that explicitly.
