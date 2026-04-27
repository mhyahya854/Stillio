# Northstar Focus Workspace

Northstar Focus Workspace is a local-first productivity and ambience desktop-style web app. It is designed as an offline-ready focus sanctuary with tasks, notes, calendar planning, focus sessions, local scenes, and local ambience controls.

## Product Identity

This app is:

- A local-first productivity and ambience desktop-style web app.
- A calm, premium, desktop-first workspace for daily focus.
- An offline-ready app where user data stays on this device.

This app is not:

- A social app.
- A calling app.
- A Snapchat, Discord, or messaging clone.
- A YouTube ambience wrapper.
- A cloud workspace.
- An AI productivity tool.

## Product Rules

1. All productivity data is local-first.
2. No Snapchat, call, or social integrations for this release.
3. No YouTube or external video embeds.
4. Ambience video and audio must use local files only.
5. User data must never silently disappear.
6. Every critical action must have visible success or failure feedback.
7. Build, lint, typecheck, and tests must pass before merging.
8. UI must feel cohesive, calm, premium, and desktop-first.

## In Scope

- Local tasks, notes, calendar events, focus timer, and session history.
- Local persistence using browser storage with visible save/error feedback.
- Import and export backups.
- Desktop-style panels with persistent layout state.
- Local image/video scenes and local audio ambience.
- Offline-first product language and behavior.

## Out Of Scope

- Cloud sync, login, accounts, teams, friends, invites, calls, or chat.
- Snapchat, Discord, YouTube, Spotify, iframe media, or remote ambience APIs.
- AI task generation, AI assistants, or external automation services.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Vitest + Testing Library
- npm as the only package manager

## Local Development

```bash
npm install
npm run dev
```

## Validation

Run the full validation loop before merging:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
```

`npm run check` runs typecheck, lint, tests, and production build in sequence. CI must use `npm ci` followed by `npm run check`.

## Storage And Backups

- Workspace data is stored locally in the browser.
- Exports should use the versioned workspace backup envelope.
- Invalid imports must not overwrite current data.
- Save failures must be visible and recoverable.
