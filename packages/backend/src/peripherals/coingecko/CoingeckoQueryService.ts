import {
  CoingeckoClient,
  CoingeckoId,
  EthereumAddress,
  getTimestamps,
  UnixTimestamp,
  UNIX_DAY,
  UNIX_HOUR,
  UNIX_MINUTE,
} from '@l2beat/common'

type Granularity = 'daily' | 'hourly'
interface Price {
  timestamp: UnixTimestamp
  price: number
}

export interface PriceHistoryPoint {
  timestamp: UnixTimestamp
  value: number
  deltaSeconds: number
}

export class CoingeckoQueryService {
  constructor(private coingeckoClient: CoingeckoClient) {}

  async getUsdPriceHistory(
    coinId: CoingeckoId,
    from: UnixTimestamp,
    to: UnixTimestamp,
    granularity: Granularity
  ): Promise<PriceHistoryPoint[]> {
    const [start, end] = adjustAndOffset(from, to, granularity)

    const prices = await this.queryPrices(coinId, start, end, granularity)

    const sortedPrices = prices.sort((a, b) => +a.timestamp - +b.timestamp)

    const timestamps = getTimestamps(from, to, granularity)

    return pickPrices(sortedPrices, timestamps)
  }

  private async queryPrices(
    coinId: CoingeckoId,
    from: UnixTimestamp,
    to: UnixTimestamp,
    granularity: Granularity
  ): Promise<Price[]> {
    if (granularity === 'daily') {
      const data = await this.coingeckoClient.getCoinMarketChartRange(
        coinId,
        'usd',
        from,
        to
      )
      return data.prices
    } else {
      const ranges = await Promise.all(
        generateRangesToCallHourly(from, to).map((range) =>
          this.coingeckoClient.getCoinMarketChartRange(
            coinId,
            'usd',
            range.start,
            range.end
          )
        )
      )

      return ranges.map((x) => x.prices).flat()
    }
  }

  async getCoinIds(): Promise<Map<EthereumAddress, CoingeckoId>> {
    const coinsList = await this.coingeckoClient.getCoinList({
      includePlatform: true,
    })

    const result = new Map()

    coinsList.map((coin) => {
      if (coin.platforms.ethereum)
        result.set(EthereumAddress(coin.platforms.ethereum), coin.id)
    })

    return result
  }
}

export function pickPrices(
  prices: { price: number; timestamp: UnixTimestamp }[],
  timestamps: UnixTimestamp[]
): PriceHistoryPoint[] {
  //TODO: Handle this case properly
  if (prices.length === 0) return []
  const result: PriceHistoryPoint[] = []

  const getDelta = (i: number, j: number) =>
    +prices[j].timestamp - +timestamps[i]

  const nextIsCloser = (i: number, j: number) =>
    j + 1 < prices.length &&
    Math.abs(getDelta(i, j)) >= Math.abs(getDelta(i, j + 1))

  let j = 0
  for (let i = 0; i < timestamps.length; i++) {
    while (nextIsCloser(i, j)) {
      j++
    }
    result.push({
      value: prices[j].price,
      timestamp: timestamps[i],
      deltaSeconds: getDelta(i, j),
    })
  }
  return result
}

function adjust(
  from: UnixTimestamp,
  to: UnixTimestamp,
  granularity: Granularity
) {
  const period = granularity === 'hourly' ? UNIX_HOUR : UNIX_DAY
  return [
    UnixTimestamp.roundUpTo(period, from),
    UnixTimestamp.roundDownTo(period, to),
  ]
}

function adjustAndOffset(
  from: UnixTimestamp,
  to: UnixTimestamp,
  granularity: Granularity
) {
  const [start, end] = adjust(from, to, granularity)
  if (granularity === 'hourly') {
    return [
      UnixTimestamp(+start - 30 * UNIX_MINUTE),
      UnixTimestamp(+end + 30 * UNIX_MINUTE),
    ]
  } else {
    // make sure that we have enough data to fill in missing prices
    return [
      UnixTimestamp(+start - 7 * UNIX_DAY),
      UnixTimestamp(+end + 7 * UNIX_HOUR),
    ]
  }
}

export const COINGECKO_HOURLY_MAX_SPAN = 80 * UNIX_DAY

export function generateRangesToCallHourly(
  from: UnixTimestamp,
  to: UnixTimestamp
) {
  const ranges = []
  for (
    let start = from;
    start < to;
    start = UnixTimestamp(+start + COINGECKO_HOURLY_MAX_SPAN)
  ) {
    const end = UnixTimestamp(+start + COINGECKO_HOURLY_MAX_SPAN)
    ranges.push({ start: start, end: end > to ? to : end })
  }
  return ranges
}
