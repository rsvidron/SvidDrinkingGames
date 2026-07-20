# Drinking Games — Project Documentation

Live at **[drinking.svidnet.com](https://drinking.svidnet.com)**.

Bar-friendly drinking-game facilitation app. Mobile-first React SPA plus a
small Node HTTP + WebSocket server, deployed as a single Railway service
in front of Supabase and Stripe.

## Index

- [Architecture](./architecture.md) — tech stack, repo layout, request flow
- [Games](./games.md) — how each game works and where its code lives
- [Authentication](./auth.md) — Supabase auth, Google OAuth, email verify
- [Access Control](./access-control.md) — grants, license keys, free weekend
- [Payments (Stripe)](./stripe.md) — Checkout flow, webhook, price / mode gotchas
- [Deployment](./deployment.md) — Railway, env vars, redeploy triggers
- [Debug endpoints](./debug.md) — how to introspect prod when things break
- [DB schema](./db-schema.md) — full SQL, RLS policies, triggers
- [Notion MCP setup](./notion-mcp-setup.md) — to port these docs into Notion later
</content>
