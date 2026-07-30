#!/usr/bin/env node
import { runCli, runDocsSearchCli } from '../../_shared/shopline-docs-search/search_docs.mjs';

runCli(import.meta.url, () => runDocsSearchCli({ commandName: 'search_docs.mjs' }));

export { runDocsSearchCli };
