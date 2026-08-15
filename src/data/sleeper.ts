import { ofetch } from "ofetch";

export type SleeperTrending = {
  player_id: string;
  count: number;
};

export async function fetchTrendingAdds(
  limit = 25,
): Promise<SleeperTrending[]> {
  return ofetch<SleeperTrending[]>(
    `https://api.sleeper.app/v1/players/nfl/trending/add?limit=${limit}`,
  );
}
