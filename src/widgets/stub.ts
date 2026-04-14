/**
 * Build the stub HTML returned by a UI resource.
 *
 * The stub references the JS+CSS served from Workers Static Assets at
 * `<baseUrl>/ui-apps/<appDir>/{main.js,styles.css}`. This keeps the MCP
 * resource payload tiny (~200 bytes) while the browser caches the bundle
 * via normal HTTP caching.
 */
export function buildAppStubHtml(appDir: string, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${baseUrl}/ui-apps/${appDir}/styles.css">
</head><body>
<div id="root"></div>
<script src="${baseUrl}/ui-apps/${appDir}/main.js"></script>
</body></html>`;
}
