# Publee MCP server

[Publee](https://publee.app) turns HTML into a limited-share URL
(`https://<slug>.publee.site`). This MCP server lets AI tools (Claude Code,
Claude Desktop, Cursor, …) publish a generated page and hand back a shareable
URL in one tool call — no build step, no hosting setup.

- Works **without an account**: anonymous sites expire after 7 days, and the
  tool result includes a claim URL that transfers the site to an account.
- With an API token, sites persist indefinitely (on every plan, including
  free), can be updated in place (same URL), and unlock more visibility
  options (password, members-only, …).

## Recommended: hosted endpoint (Streamable HTTP)

Publee runs a hosted MCP endpoint at `https://publee.app/api/mcp` with OAuth —
no local install needed:

```bash
claude mcp add --transport http publee https://publee.app/api/mcp
```

See [publee.app/docs/mcp](https://publee.app/docs/mcp) for Claude Desktop,
Cursor, and other clients.

## This repo: stdio server

For clients or environments that only support local stdio servers:

```json
{
  "mcpServers": {
    "publee": {
      "command": "npx",
      "args": ["-y", "github:publee-dev/mcp"],
      "env": {
        "PUBLEE_API_TOKEN": "publee_live_..."
      }
    }
  }
}
```

`PUBLEE_API_TOKEN` is optional — omit it to publish anonymously. Tokens are
issued at [publee.app/tokens](https://publee.app/tokens).

| Env var | Default | Purpose |
|---|---|---|
| `PUBLEE_API_TOKEN` | (none) | Bearer token. Publishes attach to your account and persist indefinitely. |
| `PUBLEE_API_URL` | `https://publee.app` | API origin override (for development). |

## Tools

### `publee_publish`

Publish a single HTML document (`html`) or a static file tree (`files`) and
get back the site URL. Pass `slug` + `overwrite: true` (token required) to
update an existing site while keeping the same URL — prefer this over
publishing a new URL when revising something already shared.

Key parameters: `html`, `files`, `title`, `visibility`
(`public` / `password` / `private` / `workspace` / `members`), `password`,
`slug`, `overwrite`, `spaMode`, `noindex`, `memberEmails`.

Full parameter reference: [publee.app/docs/api](https://publee.app/docs/api)

## Related

- [publee-dev/skills](https://github.com/publee-dev/skills) — Agent Skill +
  Claude Code plugin (`/plugin marketplace add publee-dev/skills`)

## License

MIT
