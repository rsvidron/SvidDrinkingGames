# Games

Registered in [`src/games/registry.ts`](../src/games/registry.ts).

## Up the River, Down the River

**Path**: `/games/up-down-river/setup`
**Code**: [`src/games/upDownRiver/`](../src/games/upDownRiver/)
**Devices**: 1 phone, passed around the table.

### Flow

1. **Setup** — enter number of players (2-12), names, river card count
   (4-16, even), and toggle "push means drink" behavior.
2. **Pyramid phase** — 4 rounds. Everyone at the table takes their turn
   in each round before advancing:
   - Round 1: Red or Black (1 drink)
   - Round 2: Higher or Lower than your card 1 (2 drinks)
   - Round 3: Inside or Outside your first two cards (3 drinks)
   - Round 4: Guess the suit (4 drinks)
3. **River phase** — cards flip around a vertical oval:
   - Top half = **give** side, drink values 1, 2, 3, ...
   - Bottom half = **take** side, drink values 1, 2, 3, ...
   - When a river card matches a rank in someone's 4-card pyramid,
     they give / drink that many.

### Notable UX

- River is a proper clockwise loop: top-cap horizontal card → right
  column descending (give 2-4) → bottom-cap horizontal card → left
  column ascending (take 2-4).
- Deck is filtered so only ranks held by at least one player appear
  in the river (avoids "no one has that").
- Tap the highlighted card to flip — no need to scroll to a Flip
  button.

## Kings Cup

**Path**: `/games/kings-cup/setup`
**Code**: [`src/games/kingsCup/`](../src/games/kingsCup/)
**Devices**: 1 phone.

### Flow

1. Setup: players + Guy/Girl tag (for the 5/6 rules; if no girls
   registered, 6 becomes Social).
2. Draw the whole deck one card at a time. Each rank:

| Rank | Name | Action |
|---|---|---|
| 2 | You | Pick someone to drink |
| 3 | Me | Whoever drew, drinks |
| 4 | Floor | Last to touch the floor drinks |
| 5 | Guys | All guys drink |
| 6 | Chicks | All girls drink (Social if none) |
| 7 | Heaven | Last hand up drinks |
| 8 | Mate | Pick two mates — either drinks, both drink; **stacks** across multiple 8s |
| 9 | Rhyme | Pick a word; go around rhyming |
| 10 | Categories | Pick a category; go around naming |
| J | Never Have I Ever | 3 fingers, tap to decrement |
| Q | Question Master | Pick a QM; answering their questions = drink |
| K | Make a Rule | Pick from presets or write custom; replaces previous King's rule |
| A | Waterfall | Everyone drinks until the person before them stops |

### Notable UX

- Persistent banner across every screen showing: active King's rule,
  current Question Master, and every Mate pair (up to 4).
- Game ends when the **whole deck** is played (not on the 4th King)
  so all 4 Mates come up naturally.
- Header counter tracks Kings and Mates progress (`x/4` each).

## Fuck the Dealer

**Path**: `/games/fuck-the-dealer/setup`
**Code**: [`src/games/fuckTheDealer/`](../src/games/fuckTheDealer/)
**Devices**: **2 required** — a "host" phone (dealer's) plus a "table
display" viewer (second phone / tablet / TV).

### Setup + join

1. Dealer's phone hits Setup, which creates a WebSocket room.
2. Setup shows a **QR code** encoding `/view/:code`.
3. Second device scans → `useViewerRoom` connects → Setup flips to
   "Ready to deal ✓" and Deal Me In enables.

### Flow

1. **Handoff** — "Pass the phone to the dealer. Guesser, look away."
   + Peek Card button.
2. **Peek** — dealer taps peek, sees the card at `md` size + a 5+5+3
   keypad of ranks. Dealer taps the rank the guesser said out loud.
3. **First-guess resolution**:
   - Correct → "Dealer drinks 10 seconds"
   - Wrong → banner shows "Tell them: Higher!" or "Lower!" +
     narrowed keypad for guess 2.
4. **Second-guess resolution**:
   - Correct → "Dealer drinks 5 seconds"
   - Missed both → "Guesser drinks N seconds" (N = rank-difference
     between the closer guess and the actual card), fail counter +1.
5. After 3 consecutive fails, deck passes to the next player (banner
   announces it, counter resets).
6. Game ends when deck is empty.

### Viewer (`/view/:code`)

Held in landscape by the table. Shows **13 rank columns (2 → A ace
high)** with:

- Dashed placeholders for the 4 possible slots
- Stacked cards showing what's been played
- Green outline = dealer drank (correct); red = guesser drank (missed)
- Reads from both sides of the table:
  - Rank labels appear at top AND bottom (bottom rotated 180°)
  - Status counter (cards left, fails, phase) also mirrors bottom-left

### Reliability

- Server pings every 25s to survive Cloudflare/Railway idle timeouts.
- On unexpected disconnect, both sides auto-reconnect.
- Host reconnect uses a `reclaimRoom` message with the room code +
  a secret token so the same code is preserved and viewers stay put.
- Server keeps the room for 60s after host disconnect before telling
  viewers "hostLeft."
</content>
