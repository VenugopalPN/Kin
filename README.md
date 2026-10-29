# Kin

A browser-only presales prototype for anyone starting a campaign. One note, one screen a giver can understand, and a bar on each page that names only that page.

No backend, no accounts, no real payments. Everything — websites, campaigns, and gifts — lives in this browser's `localStorage`. See [`SALES.md`](SALES.md) for the four-minute walkthrough.

## Run it

```bash
npm install
npm run dev
```

The dev server runs at [http://127.0.0.1:4322](http://127.0.0.1:4322).

## The four roles

| Step | Page | Who |
| --- | --- | --- |
| Create a website | `/platform` | Anyone creates a website from a **Name** and a **Place**; its **Website** link opens the fundraiser list |
| Start the fundraiser | `/s/:schoolSlug/admin` → `/s/:schoolSlug/admin/:campaignId` | The campaign owner sees every fundraiser, creates one with **Create a fundraiser**, and manages each one |
| Send the note | `/s/:schoolSlug/promoter/:campaignId` | The promoter opens the link, customizes the note, and sends it on |
| Give | `/s/:schoolSlug/give/:campaignId` | Someone gives directly, or plays the campaign’s chosen game then gives |

The public page lives at `/s/:schoolSlug`.

A bar at the top of every page names only that page and gives it one sentence. The other steps are not shown there. The public page is labelled **Generic page**.

## Multiple fundraisers, one leaderboard

One website can run several fundraisers at once — `/s/:schoolSlug/admin` is a list of all of them, each with its own **Manage** screen. **Create a fundraiser** opens the one-question writer; the draft also lets the owner pick a **donor game** from a small catalog (or none). Once a fundraiser exists, Manage shows **Link for the promoter**: the owner copies that address and gives it to the promoter. The promoter customizes the note and sends it on. The note contains the give page (`/s/:schoolSlug/give/:campaignId`). On that page, donors can **Give directly** with the amount tiers, or **Play and give** when a game was chosen. The public page shows the most recently started fundraiser as the hero, and lists any others underneath. Creating a website on `/platform` only adds the page; it does not start a fundraiser.

The thank-you leaderboard lives only on the admin's Manage screen (inline in the preview, and full-screen via **Show the wall**). The Family give page never shows it — a donor sees just their own "Thank you," not a wall of other names or amounts.

## AI, simulated

`src/lib/ai.ts` is a small local writer, not a live model. From one answer ("What should the money buy?") it drafts a title, letter, goal, end date, and three amounts. It also writes the one share message reused for WhatsApp, text, and Facebook, plus two labelled previews (best time to send, today's advice) on the promoter page.

## Build and check

```bash
npm run build
npx oxlint src
```
