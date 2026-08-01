#!/usr/bin/env node
// Publee MCP server (stdio) — a thin wrapper around the public publish API.
// The hosted Streamable HTTP endpoint (https://publee.app/api/mcp) is the
// recommended way to use Publee from MCP clients; this stdio server exists for
// clients and environments that only support local stdio servers.
//
// API contract: https://publee.app/docs/api

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.PUBLEE_API_URL ?? "https://publee.app";
const API_TOKEN = process.env.PUBLEE_API_TOKEN;

const server = new McpServer({ name: "publee", version: "0.1.0" });

const fileSchema = z.object({
  path: z.string().describe("File path within the site, e.g. index.html or assets/app.js"),
  content: z.string().optional().describe("Text file content (use this or contentBase64)"),
  contentBase64: z.string().optional().describe("Base64-encoded binary content"),
  mimeType: z.string().optional().describe("MIME type, required with contentBase64"),
});

server.registerTool(
  "publee_publish",
  {
    description:
      "Publish HTML (a single page or a static file tree) to a shareable https://<slug>.publee.site URL, " +
      "or update a previously published site in place (same URL) by passing its slug with overwrite: true. " +
      "Works without authentication (site expires in 7 days; the response includes a claimUrl to transfer it " +
      "to an account). With PUBLEE_API_TOKEN set, sites persist indefinitely and more options unlock.",
    inputSchema: {
      html: z.string().optional().describe("Full HTML document, published as index.html. Use this or files."),
      files: z.array(fileSchema).optional().describe("Multi-file site. Must include a root index.html (a single root .html file is auto-renamed)."),
      title: z.string().optional().describe("Site title. Defaults to the HTML <title>."),
      description: z.string().optional(),
      visibility: z
        .enum(["public", "password", "private", "workspace", "members"])
        .optional()
        .describe("Default: password. Anonymous callers may only use public or password."),
      password: z.string().min(6).optional().describe("Required when visibility is password. Min 6 chars."),
      slug: z
        .string()
        .optional()
        .describe("Subdomain (3-63 chars, [a-z0-9-]). Random if omitted. Choosing a custom slug on a NEW site requires a paid plan; reusing your own existing slug with overwrite: true works on every plan."),
      overwrite: z
        .boolean()
        .optional()
        .describe("Republish to an existing slug you own (same URL, all files replaced). Requires PUBLEE_API_TOKEN."),
      spaMode: z.boolean().optional().describe("Serve index.html for unknown paths (client-side routing)."),
      noindex: z.boolean().optional().describe("Default true (blocks search engines). false requires a paid plan."),
      memberEmails: z.array(z.string()).optional().describe("Allowlist for visibility: members (Team plan)."),
    },
  },
  async (args) => {
    const response = await fetch(`${API_BASE}/api/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
      body: JSON.stringify(args),
    });

    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error(`Publee API returned a non-JSON response (HTTP ${response.status})`);
    }
    if (!response.ok || !body.site) {
      throw new Error(body.error ?? `Publee API error (HTTP ${response.status})`);
    }

    const lines = [
      `Published: ${body.site.url}`,
      `Slug: ${body.site.slug}`,
      `Visibility: ${body.site.visibility}`,
    ];
    if (args.password) {
      lines.push(`Password: ${args.password}`);
    }
    if (body.site.expiresAt) {
      lines.push(
        `Expires: ${body.site.expiresAt} (anonymous publish — open the claim URL below after signing in to keep it permanently)`,
      );
    }
    if (body.claimUrl) {
      lines.push(`Claim URL: ${body.claimUrl}`);
    }
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
