#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../shopline-developer-core/dist/docs.js
var h = /* @__PURE__ */ __name((s, t, r) => new Promise((o, a) => {
  var i = /* @__PURE__ */ __name((e) => {
    try {
      c(r.next(e));
    } catch (n) {
      a(n);
    }
  }, "i"), u = /* @__PURE__ */ __name((e) => {
    try {
      c(r.throw(e));
    } catch (n) {
      a(n);
    }
  }, "u"), c = /* @__PURE__ */ __name((e) => e.done ? o(e.value) : Promise.resolve(e.value).then(i, u), "c");
  c((r = r.apply(s, t)).next());
}), "h");
var p = /* @__PURE__ */ __name((s, t) => h(void 0, null, function* () {
  var e;
  let r = new URLSearchParams();
  r.append("query", s.query), s.max_results !== void 0 && r.append("max_results", s.max_results.toString()), s.api_name && r.append("api_name", s.api_name);
  let a = `${t.domain.replace(/\/$/, "")}/dev/search.json?${r.toString()}`;
  return yield (yield ((e = t.fetcher) != null ? e : fetch)(a)).json();
}), "p");
var CliUsageError = class extends Error {
  static {
    __name(this, "CliUsageError");
  }
  constructor(message) {
    super(message);
    this.name = "CliUsageError";
  }
};
var parseCliArgs = /* @__PURE__ */ __name((argv, options) => {
  try {
    const parsed = parseArgs({
      args: argv,
      options,
      allowPositionals: true,
      strict: true
    });
    return {
      values: parsed.values,
      positionals: parsed.positionals
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliUsageError(message);
  }
}, "parseCliArgs");
var getStringOption = /* @__PURE__ */ __name((values, name) => {
  const value = values[name];
  return typeof value === "string" ? value : void 0;
}, "getStringOption");
var getBooleanOption = /* @__PURE__ */ __name((values, name) => {
  return values[name] === true;
}, "getBooleanOption");
var parseOptionalPositiveInteger = /* @__PURE__ */ __name((value, name) => {
  if (value === void 0)
    return void 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CliUsageError(`${name} must be a positive integer.`);
  }
  return parsed;
}, "parseOptionalPositiveInteger");
var requireSinglePositional = /* @__PURE__ */ __name((positionals, label) => {
  const value = positionals[0]?.trim();
  if (!value) {
    throw new CliUsageError(`${label} is required.`);
  }
  return value;
}, "requireSinglePositional");

// src/shared/domain.ts
var DEFAULT_DOMAIN = "https://dev-mcp.myshopline.com";
var normalizeDomain = /* @__PURE__ */ __name((domain) => domain.replace(/\/+$/, ""), "normalizeDomain");
var resolveDomain = /* @__PURE__ */ __name(({ domain, env = process.env } = {}) => {
  return normalizeDomain(domain || env.ENVIRONMENT_DOMAIN || DEFAULT_DOMAIN);
}, "resolveDomain");

// src/shared/fetch.ts
var createCheckedFetcher = /* @__PURE__ */ __name((fetcher = fetch) => {
  return async (input, init) => {
    const response = await fetcher(input, init);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`.trim());
    }
    return response;
  };
}, "createCheckedFetcher");

// src/shared/output.ts
var defaultStreams = /* @__PURE__ */ __name(() => ({
  stdout: process.stdout,
  stderr: process.stderr
}), "defaultStreams");
var writeLine = /* @__PURE__ */ __name((stream, line = "") => {
  stream.write(`${line}
`);
}, "writeLine");
var writeJson = /* @__PURE__ */ __name((stream, value) => {
  writeLine(stream, JSON.stringify(value, null, 2));
}, "writeJson");
var errorMessage = /* @__PURE__ */ __name((error) => {
  return error instanceof Error ? error.message : String(error);
}, "errorMessage");

// src/shared/docs-search.ts
var usage = /* @__PURE__ */ __name((commandName) => {
  return [
    `Usage: ${commandName} <query> [--max-results <number>] [--domain <url>] [--json]`,
    "",
    "Options:",
    "  --max-results <number>  Limit result count",
    "  --domain <url>          Override platform domain",
    "  --json                  Print raw JSON"
  ].join("\n");
}, "usage");
var formatTextResults = /* @__PURE__ */ __name((result) => {
  const sources = result.sources || [];
  if (sources.length === 0)
    return ["No documentation results found."];
  return sources.flatMap((source, index) => {
    const snippets = source.doc_slices?.slice(0, 3) || [];
    return [
      `${index + 1}. ${source.url}`,
      `   score: ${source.score}`,
      ...snippets.map((snippet) => `   - ${snippet}`)
    ];
  });
}, "formatTextResults");
var runDocsSearchCli = /* @__PURE__ */ __name(async ({
  argv = process.argv.slice(2),
  env = process.env,
  streams = defaultStreams(),
  fetcher = fetch,
  apiName,
  commandName
}) => {
  try {
    const { values, positionals } = parseCliArgs(argv, {
      "max-results": { type: "string" },
      domain: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" }
    });
    if (getBooleanOption(values, "help")) {
      writeLine(streams.stdout, usage(commandName));
      return 0;
    }
    const query = requireSinglePositional(positionals, "query");
    const maxResults = parseOptionalPositiveInteger(
      getStringOption(values, "max-results"),
      "--max-results"
    );
    const domain = resolveDomain({ domain: getStringOption(values, "domain"), env });
    const result = await p(
      {
        query,
        max_results: maxResults,
        api_name: apiName
      },
      { domain, fetcher: createCheckedFetcher(fetcher) }
    );
    if (getBooleanOption(values, "json")) {
      writeJson(streams.stdout, result);
    } else {
      for (const line of formatTextResults(result))
        writeLine(streams.stdout, line);
    }
    return 0;
  } catch (error) {
    writeLine(streams.stderr, errorMessage(error));
    writeLine(streams.stderr, usage(commandName));
    return 1;
  }
}, "runDocsSearchCli");
var isDirectRun = /* @__PURE__ */ __name((metaUrl) => {
  return Boolean(process.argv[1] && metaUrl === pathToFileURL(process.argv[1]).href);
}, "isDirectRun");
var runCli = /* @__PURE__ */ __name((metaUrl, run) => {
  if (!isDirectRun(metaUrl))
    return;
  run().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    process.stderr.write(`${errorMessage(error)}
`);
    process.exitCode = 1;
  });
}, "runCli");

// src/shared/shopline-docs-search/search_docs.ts
runCli(import.meta.url, () => runDocsSearchCli({ commandName: "search_docs.mjs" }));

export { runCli, runDocsSearchCli };
