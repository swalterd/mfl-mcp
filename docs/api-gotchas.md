# MFL API Gotchas

## Auth

- Many leagues are private and require login for most endpoints.
- Public without auth is often limited to a few exports such as `league`, `rules`, and `rosters`.
- Auth options:
  - `MFL_USERNAME` + `MFL_PASSWORD` → login cookie (`MFL_USER_ID`)
  - `MFL_APIKEY` → read-only owner exports
- Writes require username/password cookie auth.
- Use your MFL account credentials, not a franchise access code.
- Login cookie values are Base64 and may need URL-escaping for `+`, `/`, `=`.

## Host routing

- Set `MFL_LEAGUE_ID` and preferably `MFL_HOST` from your league URL.
- Global types (`players`, `playerRanks`, `adp`, `aav`, `injuries`, etc.) must hit `api.myfantasyleague.com`.
- Sending those to the league host can fail with “must go to api.myfantasyleague.com”.
- League-scoped calls use your league host (`wwwXX.myfantasyleague.com`).

## Payload quirks

- Many values are strings, including numbers.
- XML-derived JSON can collapse a single child into an object instead of an array.
- Player IDs and franchise IDs are strings; keep leading zeros (`0001`, `0531`).
- MFL often returns error bodies with HTTP 200. The client treats those as errors.

## Rate limits

- Unregistered clients are throttled; registered User-Agents get higher limits.
- Space requests (~1s) and cache durable data.
- On 429, back off; do not retry storms.

## Draft status

- Prefer `draft_status` for on-the-clock views.
- Prefer `draft_results` only when you need the full board.
- Empty future pick slots exist in the raw export; `draft_status` filters them out of the default response.
