# Product Scope

## Product Description

Northstar Focus Workspace is a local-first productivity and ambience desktop-style web app. It provides a focused workspace with local tasks, notes, calendar planning, focus timing, session history, and ambience controls.

The product promise is simple: offline-ready focus tools with local data ownership and no fake integrations.

## In-Scope Features

- Local workspace persistence.
- Tasks, notes, calendar events, timer, and session history.
- Local import/export backups.
- Local image and video scenes.
- Local audio ambience.
- Desktop panel layout with remembered positions and sizes.
- Visible save, import, export, and recovery feedback.
- Cohesive dark glass desktop interface.

## Out-of-Scope Features

- Social features.
- Calls, invites, friends, chat, or companion apps.
- Snapchat, Discord, YouTube, Spotify, or remote ambience integrations.
- Cloud sync, accounts, teams, or external storage.
- AI assistants or generated productivity suggestions.

## Local-First Rules

1. Productivity data remains on the user device.
2. The app must work without login.
3. Ambience media must be local files only.
4. Invalid or unsupported imports must never overwrite valid current data.
5. Save errors must be visible to the user.
6. Old saved data must be migrated or ignored safely.
7. Deprecated social fields must be ignored without returning UI.

## Testing Requirements

- Pure model logic must have unit tests.
- Persistence, import/export, timer/session, and migration paths must have regression tests.
- Removed social integrations must have search/regression coverage.
- `npm run check` must pass before merge.

## Build Commands

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
```
