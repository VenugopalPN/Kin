# Kin feature tour video

A 119-second, 1920x1080 narrated walkthrough of the real Kin app, aimed at someone who has never seen it.

The browser is driven by a script. On top of the page it draws a guidance layer:

- a cursor, with a ripple on every click;
- floating arrows that appear about a second before each click, with "Feature: …" tooltips;
- a glowing frame while the view scrolls, and a large down arrow when scrolling to results;
- a pulsing highlight box around each output;
- labelled cuts between roles, and a closing logo card.

The voice-over uses the offline Windows speech engine (Zira).

## Build

```powershell
cd togetherV3/demo-video
npm install                 # once; downloads a local ffmpeg via ffmpeg-static
node scripts/narrate.mjs    # voice-over, subtitles, narration/scene-timings.md
$env:DRY='1'; node scripts/record.mjs; $env:DRY=$null   # check every step without saving frames
node scripts/record.mjs     # capture frames (starts the app on :4322 if it is not running)
node scripts/assemble.mjs   # output/kin-demo.mp4 + output/review/*.png stills
```

- **Browser:** the recorder uses Chrome if installed, otherwise Edge. It runs headless with a throwaway profile in the temp folder, so it never touches your normal browser storage. The profile is deleted after the run.
- **Window size:** frames are captured from the real browser window, not from emulated screen metrics. The recorder therefore resizes the window until each frame is exactly 1600x900; the encoder scales it to 1080p. The run fails if any frame has a different size.
- **Voice:** set `VOICE` to `Microsoft David Desktop` for a male voice. `VOICE_RATE` defaults to 1. A scene's narration is sped up automatically if it would overrun the scene, and the build fails if it still does not fit.
- **Checks:** the recording fails if any step cannot find its target or any expected result does not match.

## Files

- `scripts/scenes.mjs` holds the timeline: scene ids, roles, starting state, timed actions, exact selectors, tooltip copy, and expected results.
- `narration/script.md` holds the voice-over. Each line is one sentence and one subtitle cue.
- `scripts/overlay.js` is the guidance layer injected into the page. It draws the cursor, ripples, arrows, highlight, scroll glow, role-cut cover, credential masking, and logo card.
- `scripts/record.mjs`, `narrate.mjs`, and `assemble.mjs` handle capture, voice, and encoding.
- `output/` holds the rendered video, subtitles, and review stills. It is not committed.

## Scenes

| Id | Time | Role | What happens on screen | Expected result |
| --- | --- | --- | --- | --- |
| `intro` | 0:00–0:15 | Anyone | The "SaaS" and "Licensed" deployment cards, then a click on SaaS. The arrow tours the "Platform", "Campaign", "Promoter" and "Donor" doors. | Doors page |
| `core` | 0:15–0:45 | Platform Admin, then Org Admin | "Create a website" chat, then "Fill demo values" and "Create the website". The "Email for the org admin" card appears (Demo, credentials masked); click "Done". Click the "Wattle Primary" tile under "Websites on this computer". The stat cards are highlighted. "Create a fundraiser", then "What should the money buy?" with "Winter jackets" typed. The "Written for you" draft is highlighted, then "Write the fundraiser". | "Winter jackets for every child" manage page |
| `customize` | 0:45–1:15 | Org Admin | "Amounts", "Change", rename the gift, "Save". The "Hide dollar amounts on the leaderboard" toggle. The "Website" tab opens the "Edit website" chat; click "Cancel". "Manage" on Books for the library, the "Promoters" ribbon, then "Show the wall" and "Close". | Gift renamed, toggle checked, full-screen wall opened |
| `output` | 1:15–1:43 | Org Admin, Promoter, visitor, Supporter | "Leaderboard and links" opens the Leaderboard panel (Top promoter). Cut to "Send the note" as Elena Rossi ("Copy the message" pointed at, not clicked). Cut to the public website ("Raised so far", "Also raising right now"). Cut to the "Give" page: pick $50, type "Ava", click "Give", see "Thank you, Ava!". Cut back to the leaderboard. | Elena Rossi second with $50 |
| `data` | 1:43–1:53 | Org Admin | "Send links to promoters", "Select all", "Send link to 10 promoters". | "Links sent" (Demo) with 10 personal links |
| `outro` | 1:53–1:59 | None | Fade to the Kin logo card with a pulse. | Logo card |

Scenes depend on each other in order, so the video is always recorded in one continuous take.

**Off-camera fixtures:**
- The Wattle Primary admin session is set before the first page loads, so the sign-in page is skipped.
- Elena Rossi's promoter id is created when the promoters page first opens. It is read from that page's saved data for the later cuts.

## Feature coverage

**Demonstrated on camera:**
- Landing deployment choice (SaaS)
- Doors
- Create a website chat, with Fill demo values and Create the website
- Email for the org admin
- Websites on this computer
- Dashboard stat cards
- Create a fundraiser, the Written for you draft, and Write the fundraiser
- Manage the fundraiser
- Amounts and Change
- Hide dollar amounts on the leaderboard
- Website tab and Edit website
- Promoters ribbon
- Show the wall
- Leaderboard and links, and the Leaderboard
- Send the note
- Public website (Raised so far, Also raising right now)
- Give, and Thank you
- Send links to promoters, and Links sent

**Visible but not used:**
- The Licensed card
- Copy the message, which would use the clipboard
- Print the note, which would open a print window
- Play and give / Give directly
- Read this to me
- Sign out

**Not shown:**
- The sign-in page, because the session is set off camera.
- Reset demo, which is hidden during recording.
- Typing through every Edit website chat step.
- Give again.

## Accuracy notes

- **Simulated:** the Kin draft comes from a built-in template, not a live AI service; the app labels it "Written for you". The admin email and the promoter links are marked Demo on screen and are not really sent. The Give page takes no money, which the tooltip and the voice-over both say.
- **Storage:** all data stays in this browser on this computer. Nothing syncs to a cloud, and the voice-over doesn't claim otherwise.
- **Privacy:** generated usernames and passwords are covered with "hidden for the video".

## Video freshness

- **Last verified:** against the `togetherV3` working tree on 2026-10-27. The folder is not committed yet, so there is no commit hash.
- **Recorded:** 2026-10-27, headless Edge, captured at 1600x900 and scaled to 1080p.
- **Final video:** current. 1:59.00, 1920x1080, H.264, AAC voice-over, soft English subtitles. It replaces the earlier 39-second cut, whose frames were cropped by the same window-size problem that is now fixed.
- **When to re-record:** if any of these change: the landing or doors pages, the platform chat, the campaign dashboard and create flow, the manage page, the promoters page and its send dialog, the promoter page, the public website, or the give page.
