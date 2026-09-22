# 0042 — Giphy GIF reactions next to emojis

Date: 2026-09-04
Status: Accepted
Decision: The table reaction picker gained a GIF tab that searches Giphy (trending when the query is empty). GIFs are ephemeral like emojis: a Giphy CDN URL is broadcast on the existing `emoji-{gameId}` Supabase channel and shown for 5s. Search runs in a Server Action (`searchGifs`) so `GIPHY_API_KEY` stays server-only. Receivers only render `https` URLs on `media*.giphy.com` / `i.giphy.com`. Rating is `pg-13` to match the existing emoji set. Ad-hoc P2P is unchanged (emoji/GIF still not on the data channel).
Context: User asked to send Giphy GIFs from the same 😊 control as emojis, and provided an API key.
Rationale: Reusing the reaction broadcast avoids a chat/persistence feature (out of scope in `docs/PRODUCT.md`). A server proxy avoids exposing the key. Native `<img>` tags load Giphy's own files; nothing is hosted by us. Official "Powered by GIPHY" attribution sits in the picker as required by Giphy's terms.
Consequences: New env var `GIPHY_API_KEY` (`.env.local` + Vercel). Picker UI in `EmojiButton`/`GifPicker`. Display via `ReactionBubble`. Online + local wired; ad-hoc still has no reaction transport.
Alternatives_Rejected: Client-side Giphy SDK with a public key (would leak the key and add a dependency); persisting GIFs in `games.state` (unnecessary for a 5s overlay); Tenor/other providers (user asked for Giphy).
