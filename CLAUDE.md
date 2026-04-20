# Pipeline Integration

Slug: `colordrop` — tracked in the Coding Brothers Pipeline Dashboard
(https://pipeline-juergenertels-projects.vercel.app).

## When to push an update

After any meaningful milestone, call the `pipeline-update` PowerShell
function (defined globally in the user PS profile, available in every
shell on this machine):

- Stage transitions (e.g. `mvp_in_development` → `testing`)
- Progress jumps of +10% or more
- Completing or adding notable todos
- Blocker encountered or cleared

## How

```powershell
pipeline-update -Slug colordrop `
  -Progress 40 `
  -Summary "Kurzbeschreibung was passiert ist" `
  -Todos @("Nächster Schritt 1", "Nächster Schritt 2")
```

Optional params: `-Stage <stage>`, `-Status <active|blocked>`.

**Valid stages:** `idea | concept | mvp_in_development | testing |
launch_prep | live | optimization | monetization | paused | archived`

## Don't over-push

The dashboard is an overview, not a commit log. Skip trivial changes
(typo fixes, comments). Rate-limit is 10 requests / 10 seconds.

## Todo-merge behaviour

Existing open todos with matching titles remain untouched. Todos no
longer mentioned get marked `superseded` (not deleted). New titles
land at the top of the card.

## Troubleshooting

`pipeline-update: not recognized` → open a fresh PowerShell window
(profile loads on shell startup).

`HTTP 401` → `$env:PIPELINE_SECRET` is stale, re-check the profile.

`HTTP 404 project_not_found` → slug typo, or project not in DB.
