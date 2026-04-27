# Release Checklist

## Build Health

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
```

Acceptance:

- `npm run check` passes.
- CI uses `npm ci`.
- `node_modules` is not committed.
- `dist` is not committed.
- npm is the only package manager.

## Product Scope

- Product language says local-first, offline-ready, and saved on this device.
- No visible social, call, invite, companion, cloud sync, AI, or remote media promises.
- Every visible feature has working behavior.

## Search Checklist

Search active product code for:

```txt
Snapchat
Discord
CompanionPanel
CompanionAction
onCall
invite
YouTube
youtube.com
youtu.be
iframe
external video
remote audio
```

Expected result: no active product code references.

## Manual QA

- Create, edit, complete, restore, and delete a task.
- Create, rename, edit, pin, unpin, and delete a note.
- Create, edit, and delete a calendar event.
- Start, pause, resume, complete, and reset the timer.
- Confirm focus session totals update.
- Import a valid backup.
- Reject an invalid backup without changing current state.
- Export a backup.
- Reload and confirm local data is still present.
- Open two tabs and confirm storage update feedback.
- Switch scenes and reload.
- Enable ambience audio and mute all audio.
- Use reduced motion.
- Reset panel layout.
- Resize browser and confirm panels remain reachable.

## Final Gate

The app is release-ready only when:

- The app builds cleanly.
- The app has no fake integrations.
- All user data is local and protected.
- Errors are visible and recoverable.
- Productivity tools are usable every day.
- Local video and audio use local files only.
- Old saved data does not break the app.
- Tests protect important flows.
