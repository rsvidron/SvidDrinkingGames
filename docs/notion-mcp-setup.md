# Setting up the Notion MCP server

To let a future Claude Code session write / update pages in your
Notion workspace directly, you install a **Notion MCP server** on your
machine. MCP servers can't be installed remotely by Claude — you set
them up locally, then Claude uses them.

## One-time setup (~10 min)

### 1. Create a Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. **+ New integration**
3. Name: `Claude Code` (or whatever). Associated workspace = the one
   you want docs written to.
4. Capabilities: check **Read content**, **Update content**, **Insert content**.
5. Submit → copy the **Internal Integration Secret** (starts with
   `secret_...`).

### 2. Share a Notion parent page with the integration

MCP integrations only see pages that have been explicitly shared with
them.

1. In Notion, create a new page — e.g. `Drinking Games / Docs`.
2. Top-right ⋯ → **Connections** → **Add connections** → pick your
   Claude Code integration.
3. Copy the page URL. The last chunk is the page ID (e.g.
   `https://notion.so/Drinking-Games-Docs-abcdef1234...` → page id
   is `abcdef1234...`).

### 3. Install the Notion MCP server

The community server is `@notionhq/notion-mcp-server`. Run it via
`npx` so no global install is needed:

```
npx -y @notionhq/notion-mcp-server
```

Verify it starts without errors, then Ctrl+C.

### 4. Register it with Claude Code

Depending on your OS:

**macOS / Linux** — edit `~/.claude.json` (create if missing):

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_API_KEY": "secret_xxx",
        "NOTION_PAGE_ID": "abcdef1234..."
      }
    }
  }
}
```

**Windows** — the same JSON, at `%USERPROFILE%\.claude.json`.

Restart Claude Code. In the next session, the Notion tools appear
under the `mcp__notion__*` prefix (or similar depending on the server
version).

### 5. Alternative — use Claude Code's built-in MCP command

Newer Claude Code CLI supports:

```
claude mcp add notion npx -y @notionhq/notion-mcp-server \
  -e NOTION_API_KEY=secret_xxx \
  -e NOTION_PAGE_ID=abcdef1234...
```

Which writes the config for you.

## When it's set up, tell Claude next session

> "Notion MCP is configured. Port the docs from `docs/*.md` into the
> shared Notion parent page as sub-pages, one page per file."

Claude will read the markdown from the repo and create matching
Notion pages under your parent.

## Security note

Rotate the Notion integration secret after the initial port. You can
either delete + recreate the integration, or use Notion's UI to
regenerate the secret and update `NOTION_API_KEY` in your `.claude.json`.
</content>
