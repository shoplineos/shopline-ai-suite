# SHOPLINE AI Suite

Developer skills for building with SHOPLINE across docs search, Admin REST APIs, Storefront GraphQL, and theme development workflows.

SHOPLINE AI Suite is a GitHub-hosted skill repository designed for AI coding agents and plugin-based developer tools. It provides packaged SHOPLINE skills that help agents search current documentation, work with API schemas, and validate GraphQL code with better grounding and lower hallucination risk.

## Install

### Claude Code

Install from the plugin marketplace:

```text
/plugin marketplace add shoplineos/shopline-ai-suite
/plugin install shopline-ai-suite
```

Restart Claude Code after installation so the SHOPLINE skills are loaded in the next session.

### Codex

In the Codex app, add this repository as a custom marketplace:

1. Open **Plugins** from the Codex sidebar.
2. Click **Add** or **Add plugin marketplace**.
3. Enter `shoplineos/shopline-ai-suite` as the source and use `main` as the Git ref.
4. Select **SHOPLINE AI Suite**, install `shopline-ai-suite`, then restart Codex.

For Codex CLI, register the marketplace and install the plugin:

```text
codex plugin marketplace add shoplineos/shopline-ai-suite
codex plugin add shopline-ai-suite@shopline-ai-suite
```

### VS Code

For VS Code Copilot Agent Plugins:

1. Run **Chat: Install Plugin from Source** from the VS Code command palette.
2. Use `shoplineos/shopline-ai-suite` as the source repository.
3. Select `shopline-ai-suite` when VS Code shows the plugins in this repository.

Reload VS Code after installation if the new skills are not visible immediately.

### Antigravity CLI

In your terminal, install the SHOPLINE AI Suite plugin:

```text
agy plugin install https://github.com/shoplineos/shopline-ai-suite
```

Verify the installation with:

```text
agy plugin list
```

### **Existing Installs**

If you have previously installed SHOPLINE AI Suite, follow the steps below to update it and prevent staying on an outdated version.&#x20;

### **Claude Code**

```
/plugin marketplace update shoplineos/shopline-ai-suite
/plugin update shopline-ai-suite@shopline-ai-suite
```

**Codex CLI**

```
codex plugin marketplace upgrade shoplineos/shopline-ai-suite
codex plugin add shopline-ai-suite@shopline-ai-suite
```

There is no `codex plugin update`; re-running `add` reinstalls from the refreshed snapshot. For a non-default profile, run both commands against the same `CODEX_HOME`.

**Codex App**

Refresh the marketplace from the **Plugins** panel (remove and re-add the `shoplineos/shopline-ai-suite` marketplace if there is no refresh control), then reinstall **shopline-ai-suite** and restart Codex.

## What You Get

- **Grounded SHOPLINE answers**: Search current SHOPLINE developer docs before answering.
- **API-focused retrieval**: Find Admin REST endpoints, fields, paths, and related API details.
- **GraphQL generation and validation**: Generate and validate Storefront GraphQL operations against packaged schema assets.
- **Theme development support**: Cover theme development, app extension integration, performance analysis, and template migration workflows.

## Included Skills

| skills                        | purpose                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `shopline-dev`                | General-purpose SHOPLINE developer documentation search                                                                         |
| `shopline-admin-rest`         | Search for SHOPLINE Admin REST API documentation and endpoint definitions                                                       |
| `shopline-storefront-graphql` | Search and validate SHOPLINE Storefront GraphQL operations                                                                      |
| `shopline-auth`               | Helps developers complete SHOPLINE public app OAuth authorization without reading the full developer documentation from scratch |

## License

This project is licensed under the MIT License. Copyright (c) 2026 Shopline Commerce Pte. Ltd. See the [LICENSE](./LICENSE) file for details.

This project bundles components from third-party open-source projects, which are provided under their own license terms. See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for the applicable copyright notices and license texts.

## Trademarks

SHOPLINE and the SHOPLINE logo are trademarks of Shopline Commerce Pte. Ltd. and its affiliates. The MIT License granted for this software does not include any right to use the SHOPLINE name, the SHOPLINE logo, or any other SHOPLINE trademarks, trade names, or brand features, whether to endorse or promote any product or service or otherwise, except for reasonable and customary use in describing the origin of this software.

All other product names, logos, and brands mentioned in this repository — including Claude Code, Codex, Cursor, VS Code, and Antigravity — are the property of their respective owners. They are used for identification and compatibility-description purposes only, and such use does not imply any affiliation with or endorsement by their respective owners.
