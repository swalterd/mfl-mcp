# Data Sources

## MFL endpoints

- League host (league-specific): `https://wwwXX.myfantasyleague.com/YEAR/...`
- Global host (site-wide data): `https://api.myfantasyleague.com/YEAR/...`

Used feeds include:

- League/team: `league`, `rules`, `rosters`, `freeAgents`, `schedule`, `transactions`, `leagueStandings`
- Draft: `draftResults`, `myDraftList`, `selectedKeepers`
- Research: `players?DETAILS=1`, `playerRanks`, `adp`, `aav`, `injuries`, `playerProfile`, `projectedScores`

Host routing:

- Global research endpoints must use `api.myfantasyleague.com`.
- League-scoped endpoints use the configured/discovered league host.

## External sources

- DynastyProcess `db_playerids.csv` — crosswalk (`mfl_id` ↔ FantasyPros / Sleeper / ESPN / CBS)
- DynastyProcess `values-players.csv` — dynasty values + ECR
- Sleeper trending adds endpoint

## Enrichment model

Availability and draft tools join these sources server-side:

1. MFL free-agent / roster IDs
2. MFL player database (`name`, `position`, `team`)
3. FantasySharks ranks + MFL ADP
4. DynastyProcess values when crosswalk IDs match
5. Injury data for `research_available`

Resulting player objects expose:

- identity: `id`, `name`, `position`, `team`
- ranking: `rank`, `adp`, `value2qb`
- derived: `valueOverAdp`, `draftScore`

## Freshness and caching

- Player DB is cached daily on disk under `MFL_CACHE_DIR`.
- Login cookie is cached for the session window.
- External DynastyProcess values expose `as_of` / scrape dates in research output when available.
- Request pacing is enforced (~1s between MFL calls) to reduce 429s.
