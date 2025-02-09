import axios from "axios";
import { ITVLPoolResponse } from "./type.js";

export async function getPoolByTVL(range: number) {
  const res = (
    await axios.get("https://swap.api.sui-prod.bluefin.io/api/v1/pools/info")
  ).data as ITVLPoolResponse[];
  const sortedPools = res.sort((a, b) => parseInt(b.tvl) - parseInt(a.tvl));
  const formatedPools = sortedPools.map((pool) => {
    return {
      ...pool,
      tvl: parseInt(pool.tvl),
    };
  });
  return formatedPools.slice(0, range);
}
