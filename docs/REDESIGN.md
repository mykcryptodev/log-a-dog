# Log a Dog — Redesign

*The official home of the internet's summer hotdog-eating sport.*

> Status: **Implemented** (Phases 0–6) on branch `react-best-practices-and-image-fixes`.
> This was the design + implementation blueprint; the app now ships the condiment theme,
> feed-first home, redesigned card + VoteBar, motion system, judge queue, scoreboard
> leaderboard, profile hero, grill-shimmer states, and the rules explainer.
> Grounding facts: Next.js 15 (Pages Router, `src/pages/`), Tailwind + **DaisyUI** (default themes, no
> custom palette today), `Segment` font, dark mode via `prefers-color-scheme`. Only animation dep is
> `js-confetti` — no `framer-motion` yet. DaisyUI is load-bearing (thirdweb buttons, every
> `card bg-base-200`, all `<dialog>` modals), so the realistic move is to **retheme** DaisyUI with a
> custom condiment palette, not rip it out.

---

## 1. Product & design critique (current state)

**What's working (keep it):**
- The voice. Funny loading copy (`Create.tsx:416-424` — "Guzzlin glizzy into the blockchain…",
  "Slathering on the 'sturd…"), the 🌭 FAB, "Earn money eating hotdogs." This is the soul — don't sand it off.
- Confetti on log = the dopamine moment already exists (`Create.tsx:26`).
- The card already has the right *content* (photo hero, identity, voting, share, status).

**What's hurting it:**

| Problem | Where | Impact |
|---|---|---|
| **Buried lede.** The feed is gated behind a 5rem banner image + a dead "Season 2 is over" YouTube embed + tab switcher before any dog appears. | `index.tsx:50-107` | First-time visitor sees a press release, not a feed. The product *is* the feed — it should be the first pixel. |
| **No identity, just defaults.** DaisyUI default theme + blurry pink/yellow gradient blobs read as "generic web3 hackathon," not "global sport." | `Layout.tsx:30-46`, `tailwind.config.ts` | Looks unfinished, not intentionally absurd. |
| **Card is a flat info dump.** Photo is `400×400` boxed inside `card bg-base-200 bg-opacity-25`, with attestation badge, log id, AI judgement, countdown, comments, vote, *and* Zora MCAP/volume all crammed in one `opacity-50` row. | `HotdogCard.tsx:216-399` | The photo isn't the hero; crypto stats compete with it. `opacity-50` on the whole action row makes the primary CTA (vote) look disabled. |
| **Voting is invisible.** "Judging a ridiculous sporting event" is the best mechanic in the app, but it's a small button in a faded row. | `HotdogCard.tsx:334-352` | The thing that makes this a *competition* is the least prominent element. |
| **Crypto leakage.** "MCAP $", "24H VOL", coin trading, "I will pay my own blockchain fees" checkbox are top-level. | `HotdogCard.tsx:356-399`, `Create.tsx:361-374` | Violates "don't feel crypto-heavy." These should be progressive-disclosure, not card furniture. |
| **No motion system.** Confetti is the only animation. No transitions on vote, rank, tab, or card entry. | whole app | Nothing feels "snappy/satisfying" because nothing moves. |
| **Tabs instead of a feed.** "logs / leaderboard" as `tabs-boxed` is a dashboard pattern. | `index.tsx:91-107` | Feed and leaderboard should be peers in nav, not a toggle inside the homepage. |

**One-line diagnosis:** *The content is a TikTok feed wearing a crypto dashboard's clothes.* The redesign is
mostly about hierarchy, motion, and a real brand skin — not new features.

---

## 2. Information architecture

Current nav: `Feed · Earn · FAQ · Notify · Profile`. New IA, 5 tabs, thumb-reachable, with **Log** as the
center action:

```
┌─────────────────────────────────────────────┐
│  🌭 LOG A DOG          SEASON 3 · DAY 14  🔥7 │  ← sticky mini-header (brand + your streak)
├─────────────────────────────────────────────┤
│                                               │
│              [ VERTICAL FEED ]                │  ← the product
│                                               │
├─────────────────────────────────────────────┤
│   🍔        🏆         ➕        🧑‍⚖️        👤    │  ← bottom nav
│  Feed   Leaderboard   LOG    Judge    You     │
└─────────────────────────────────────────────┘
```

- **Feed** (`/`) — the home. Vertical, full-bleed dog cards.
- **Leaderboard** (`/leaderboard`) — promoted from a tab to a peer destination. Season + all-time + "near me" rank.
- **LOG** (center, raised) — the ceremonial upload. Replaces today's two redundant triggers
  (`Create.tsx:309` button + `:315` FAB) with one obvious hero action.
- **Judge** (`/judges` exists) — a *dedicated voting queue* of dogs in their 48h window. This is the killer
  surface today's app hides. "X dogs need a verdict."
- **You** (`/profile/[username]`) — stats, streak, season progress, your dogs.

"Earn" and "FAQ" fold into **You** (your earnings + rewards) and a first-run **rules explainer** respectively.
Detail page stays at `/dog/[logId]` (good for share/OG).

---

## 3. Visual direction

### Color — "The Condiment System"
Define these as a **custom DaisyUI theme** (`data-theme="logadog"` light + `logadog-night` dark) in
`tailwind.config.ts`. DaisyUI semantic tokens map to condiments so existing `bg-base-200`, `btn-primary`,
etc. instantly reskin everything:

| Token | Name | Light | Use |
|---|---|---|---|
| `primary` | **Mustard** | `#F5C518` | Brand, primary CTAs, the bun-bounce button |
| `secondary` | **Ketchup** | `#E23B2E` | Energy, rank #1, live indicators |
| `accent` | **Relish** | `#5BA84A` | **VALID DOG** verdicts, streaks |
| `error` | **Sus Red** | `#D7263D` | **SUS** / invalid verdicts |
| `base-100` | **Bun** | `#FFF8EC` | App background (warm cream, not white) |
| `base-200` | **Toasted Bun** | `#F4E7CE` | Cards |
| `neutral` | **Char** | `#1E1A17` | Text, grill marks |
| `info` | **Sky Picnic** | `#7FB7D9` | Quiet metadata |

Night mode: Char background `#16110D`, neon Mustard `#FFD428`, "stadium at night" feel. Replace the 4 blurred
gradient blobs (`Layout.tsx`) with **one** subtle radial sun-glow top-center + a faint repeating grill-grate
texture at very low opacity — summery, not soupy.

### Typography
- **Display / numbers:** a chunky condensed grotesque — **"Anton"** or **"Druk Wide"** — for rank numbers,
  dog counts, "VALID DOG" stamps, headers. This is the "sport scoreboard" voice. (Today's `Segment` is too
  techy for the hero.)
- **Body / UI:** keep something clean — **Inter** or your existing `Segment` for labels/body.
- Numbers are tabular and **huge**. A leaderboard rank or a dog count is the loudest thing on screen.

### Spacing & shape
- 4px base scale. Cards: `rounded-3xl`, generous `p-0` on media (full-bleed photo), content padded `px-4`.
- Soft, warm shadows (`shadow-[0_8px_30px_rgba(226,59,46,0.12)]`) not gray box-shadows.

### Iconography
Swap thin Heroicons outline for **filled, rounded, slightly chunky** icons. Custom set where it matters: a bun,
a bottle (vote), a gavel-dog (judge), a flame (streak). Emoji is on-brand and free — lean into 🌭🔥🏆🧑‍⚖️.

### Imagery
Photo is sacred. Full-bleed, `object-cover`, 4:5 portrait crop (Instagram ratio) — better for a vertical phone
feed than today's 1:1 `400×400`. Use blurhash placeholders (Zora data already exposes
`previewImage.blurhash`, `HotdogCard.tsx:60`).

### Animation language
**Add `motion` (framer-motion).** It's tree-shakeable and production-grade. Principles:
- **Fast & springy.** 150–300ms, spring physics, never linear-slow.
- **Squash-and-stretch** on the bun button — food should feel bouncy.
- **Condiment as motion.** Mustard/ketchup *squirts* and *streaks* are the signature transition.
- Respect `prefers-reduced-motion` — fall back to opacity fades.

---

## 4. Major screens

### Home / Feed (`/`)
Kill the banner+YouTube+tabs intro. **First paint is a dog.** Sticky slim header:
`🌭 LOG A DOG · SEASON 3 · DAY 14` left, your `🔥 streak` right. Then an infinite vertical column of full-bleed
cards (one per viewport-ish on mobile, ~600px max on desktop, centered). New dogs slide in from top with a
sizzle. A thin **"🌭 3 new dogs — tap to sizzle"** pill appears at top when the indexer pulls new logs (you
already refetch in `Create.tsx:147`).

### Log / Upload — *the ceremony*
Tapping center **LOG** opens a full-screen takeover (not the cramped daisyui modal). Three beats:
1. **"Show us the dog."** Big camera/drop zone, copy `📷 Take a picture of you eating it!` (reuse
   `DEFAULT_UPLOAD_PHRASE`). On mobile, default to camera.
2. **The reveal.** Photo snaps in with a stamp sound + slight scale-bounce. Optional one-line caption.
   "Advanced" (gas) collapsed and de-emphasized — most users never see "blockchain fees."
3. **LOG IT.** A fat Mustard button. On confirm: keep your funny `TransactionStatus` messages
   (`Create.tsx:416-424`) but show them over the *already-uploaded photo* with a sizzling grill animation,
   then **confetti** (you have it), then a stamp slams down: **"DOG LOGGED · #1,402 this season."** Then the
   Farcaster share prompt.

### Submission detail (`/dog/[logId]`)
The card, expanded: full photo, full verdict tally with a live valid/sus bar, comments, the AI judge's take,
and — *below the fold* — the Zora coin info for the crypto-curious. This is the OG-shared page
(`api/og/[logId]` already exists), so make it gorgeous.

### Leaderboard (`/leaderboard`)
A **stadium scoreboard.** Top 3 on podium cards (gold/silver/bronze with a Mustard glow on #1). Rest as a tight
list with **huge tabular rank numbers** and `🌭` counts. Toggle: `Season · All-time · Near me`. When ranks
change on refetch, rows **animate to their new position** (layout animation) — you can *watch* yourself climb.

### Judge / Voting queue (`/judges`)
"**14 dogs awaiting your verdict.**" One dog at a time, big photo, a countdown ring (you have
`VotingCountdown`), and two enormous buttons: **VALID DOG** (Relish) / **SUS** (Sus Red). Swipe-to-judge on
mobile (Tinder-for-glizzies). Each verdict triggers a stamp + the next dog slides in.

### Profile / You (`/profile/[username]`)
Hero stat block: total 🌭, current 🔥 streak, season rank, season progress ring. Grid of your dogs (each with
its verdict stamp). Earnings/rewards (the old "Earn") live in a quiet card here.

### Season / rules explainer
First-run + accessible from header. 4 swipeable cards: *"1. Eat a dog. 2. Log it. 3. Others judge it.
4. Climb the board. Winner takes the pot."* Absurd-but-clear. Replaces the dense FAQ as the entry point (keep
full FAQ linked).

### States
- **Empty feed:** a lonely cartoon hotdog: *"No dogs yet today. Be the first to log. The grill is hot. 🔥"* +
  a Log button.
- **Loading:** skeleton cards with a **shimmer that looks like grill marks** sweeping across.
- **Error:** *"The grill went cold. We couldn't load the dogs."* + Retry. (You already moved error-surfacing
  the right way in commit `2d1ef1d`.)

---

## 5. Component specs

### Feed card (redesign of `HotdogCard.tsx`)
```
┌───────────────────────────────────────┐
│  ◯ avatar  display_name  🔵fid   ⋯     │  ← identity row (drop the opacity-50)
│            via logger (only if proxied)│
├───────────────────────────────────────┤
│                                        │
│           [ FULL-BLEED PHOTO ]         │  ← 4:5, object-cover, blurhash
│                                        │
│   ┌──────────┐              [⏱ 14:22]  │  ← verdict stamp (if resolved) +
│   │ VALID DOG│                          │     countdown ring (if in window)
│   └──────────┘                          │
├───────────────────────────────────────┤
│  🥬 VALID DOG          SUS 🔴           │  ← THE vote bar — primary, full-width
│  ████████████░░░░  68% valid · 23 votes│     animated fill
├───────────────────────────────────────┤
│  💬 12   ↗ Share          🌭 #1,402     │  ← comments / share / season number
└───────────────────────────────────────┘
   ⌄ market data (collapsed, crypto-curious only)
```
Key changes vs today: photo full-bleed and bigger; **vote moves from a faded sub-button to a primary
full-width bar**; Zora MCAP/VOL/trading collapses behind a `⌄` (off by default); remove blanket `opacity-50`
from the action row; verdict shown as a *stamp on the photo*, not a tiny badge. Keep `memo`
(`HotdogCard.tsx:428`) and the stable `onRefetch`.

### Vote control
- Two buttons, optimistic. On tap: button does a squash-bounce, a **condiment streak** wipes across (mustard
  for valid, ketchup for sus), the percentage bar animates to its new value, the count ticks up. If it resolves
  a verdict, a **stamp slams** onto the photo with a tiny screen-shake + a few confetti bits.
- Disabled/expired → bar becomes a static result, buttons hide (you already gate on `isExpired`,
  `HotdogCard.tsx:339`).

### Upload
- Full-screen `motion` takeover, not `<dialog>`. Reuse `Upload`, the debounced Zora metadata upload
  (`Create.tsx:66-91`), and the optimistic `addPendingDog` flow — only the *chrome* changes. Gas/advanced
  behind a collapse, off by default.

### Leaderboard row
- `layout` animation for rank changes, tabular `Anton` numbers, podium treatment for top 3, "you" row
  pinned + highlighted (logic already in `LeaderboardList.tsx:75-89`).

---

## 6. Microcopy

| Place | Copy |
|---|---|
| Tagline | "The internet's summer hotdog-eating sport." (`APP_DESCRIPTION` is "Earn money eating hotdogs" — keep as secondary hook) |
| Empty feed | "No dogs yet today. The grill is hot. 🔥 Be the first." |
| Log button | "LOG A DOG" → mid-flow: "SLAP IT ON THE GRILL" |
| Post-log stamp | "DOG LOGGED. Dog #1,402 this season." |
| Vote buttons | "VALID DOG" / "SUS" |
| Judge queue | "14 dogs await your verdict. Don't let the frauds win." |
| Verdict win | "The people have spoken. VALID DOG. ✅" |
| Verdict loss | "Ruled SUS. The jury wasn't buying it. 🚩" |
| Streak | "🔥 7-day streak. Don't break the chain." |
| Loading | keep yours — "Guzzlin glizzy into the blockchain…" |
| Error | "The grill went cold. Couldn't load the dogs." |
| Share | "be like {name}, log your dogs! 🌭" (keep) |

---

## 7. Animation & interaction specs

| Interaction | Spec |
|---|---|
| **Bun bounce** (primary buttons) | `whileTap={{ scale: 0.92 }}` + spring back overshoot `{ stiffness: 400, damping: 12 }`. |
| **Card entry** | new dogs: `y: -16, opacity: 0 → 0, 1`, spring; a 1-frame mustard streak wipes top-down (sizzle). |
| **Vote** | button squash → condiment streak (clip-path wipe, 250ms) → bar `width` spring → count `+1` roll. |
| **Verdict stamp** | rotate `-12°`, scale `1.4 → 1`, slam at 200ms with `[0,2,-1,0]px` shake; 6–8 confetti emojis. |
| **Confetti** | keep `js-confetti` lazy-load (`Create.tsx:26`); emojis `['🌭','🎉','🌈','✨']`. |
| **Rank movement** | framer `layout` on leaderboard rows; #1 gets a slow Mustard glow pulse. |
| **Tab/route** | shared-element morph on the bottom-nav indicator; 200ms. |
| **Pull-to-refresh** | rubber-band a hotdog that "sizzles" then fires the refetch you already do. |
| **Reduced motion** | all of the above degrade to a 120ms opacity fade. |

All under ~300ms, GPU-friendly (`transform`/`opacity` only), so Core Web Vitals stay green. Keep images lazy
(`next/image` already in use) + blurhash; the feed should virtualize once lists get long.

---

## 8. Layout (mobile & desktop)

- **Mobile (primary):** single column, full-bleed cards, sticky slim header, raised-center bottom nav.
  Everything thumb-reachable.
- **Desktop:** centered feed column (max ~600px) with a **persistent right rail** — live leaderboard top 5 +
  "dogs awaiting verdict" count + season progress. Left rail = nav. Think Twitter/X 3-column, but the middle
  is glizzies. Replaces today's `max-w-7xl` empty-feeling layout (`Layout.tsx:47`).

---

## 9. Prioritized implementation plan

**Phase 0 — Brand skin (1–2 days, huge visual ROI, low risk).** Custom DaisyUI `logadog` theme in
`tailwind.config.ts` (condiment palette), Anton/display font, replace gradient blobs with sun-glow + texture.
*Every existing component reskins for free.*

**Phase 1 — Feed-first home.** Remove banner/YouTube/tabs from `index.tsx`; make the feed the first paint; add
the slim sticky header; new bottom nav (Feed/Leaderboard/**Log**/Judge/You).

**Phase 2 — The card.** Rework `HotdogCard.tsx`: full-bleed 4:5 photo, promote vote to a full-width animated
bar, collapse Zora data, verdict-as-stamp. Add `motion`.

**Phase 3 — Motion pass.** Bun bounce, vote streaks, verdict stamp, confetti integration, card-entry sizzle,
reduced-motion fallbacks.

**Phase 4 — Ceremony upload + Judge queue.** Full-screen log takeover; build `/judges` swipe-to-judge.

**Phase 5 — Leaderboard & Profile.** Podium + animated rank movement; profile stat hero + season progress;
fold in Earn.

**Phase 6 — States & polish.** Empty/loading(grill-shimmer)/error, rules explainer, OG detail page glow-up.

---

## 10. Code examples

These match the real stack (Next 15 Pages Router, Tailwind+DaisyUI, `next/image`) and add `motion`.

**A. The custom DaisyUI theme** — `tailwind.config.ts`:
```ts
import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Anton", "Segment", "system-ui", "sans-serif"],
        body: ["Segment", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: { dog: "0 8px 30px rgba(226,59,46,0.12)" },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        logadog: {
          primary: "#F5C518",   // mustard
          secondary: "#E23B2E", // ketchup
          accent: "#5BA84A",    // relish (valid)
          error: "#D7263D",     // sus
          neutral: "#1E1A17",   // char
          "base-100": "#FFF8EC", // bun
          "base-200": "#F4E7CE",
          info: "#7FB7D9",
          "--rounded-box": "1.5rem",
          "--rounded-btn": "1rem",
        },
      },
      "night", // dark fallback; or define logadog-night
    ],
  },
} satisfies Config;
```

**B. Bun-bounce primary button** (`src/components/utils/DogButton.tsx`):
```tsx
import { motion } from "motion/react";
import { type ComponentProps } from "react";

export function DogButton({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 12 }}
      className={`btn btn-primary font-display tracking-wide ${className}`}
      {...(props as ComponentProps<typeof motion.button>)}
    />
  );
}
```

**C. Animated vote bar** (the new heart of the card):
```tsx
import { motion } from "motion/react";

export function VoteBar({
  valid, invalid, onVote, disabled,
}: {
  valid: number; invalid: number;
  onVote: (v: boolean) => void; disabled?: boolean;
}) {
  const total = valid + invalid || 1;
  const pct = Math.round((valid / total) * 100);

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }} disabled={disabled}
          onClick={() => onVote(true)}
          className="btn btn-accent flex-1 font-display tracking-wide text-base-100"
        >
          🥬 VALID DOG
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }} disabled={disabled}
          onClick={() => onVote(false)}
          className="btn btn-error flex-1 font-display tracking-wide text-base-100"
        >
          SUS 🔴
        </motion.button>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-error/30">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
      <p className="mt-1 text-center text-xs opacity-70">
        {pct}% valid · {total} verdict{total === 1 ? "" : "s"}
      </p>
    </div>
  );
}
```

**D. Verdict stamp** (slams onto the photo):
```tsx
import { motion } from "motion/react";

export function VerdictStamp({ valid }: { valid: boolean }) {
  return (
    <motion.div
      initial={{ scale: 1.4, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -12, x: [0, 2, -1, 0] }}
      transition={{ type: "spring", stiffness: 300, damping: 14 }}
      className={`pointer-events-none absolute left-4 top-4 rounded-xl border-4 px-3 py-1
        font-display text-2xl tracking-wider
        ${valid ? "border-accent text-accent" : "border-error text-error"}`}
    >
      {valid ? "VALID DOG" : "SUS"}
    </motion.div>
  );
}
```

**E. Leaderboard with animated rank movement** (wrap your `LeaderboardList` rows):
```tsx
import { motion, AnimatePresence } from "motion/react";

// inside the map in LeaderboardList.tsx, replace the row <div> with:
<motion.div
  key={address}
  layout
  transition={{ type: "spring", stiffness: 500, damping: 40 }}
  className="flex items-center justify-between gap-2 rounded-2xl bg-base-200/50 p-3"
>
  <div className="flex items-center gap-3">
    <span className="font-display text-2xl tabular-nums text-secondary w-10 text-center">
      {rank}
    </span>
    {/* avatar + name unchanged */}
  </div>
  <span className="font-display text-2xl tabular-nums">{hotdogCount} 🌭</span>
</motion.div>
```
