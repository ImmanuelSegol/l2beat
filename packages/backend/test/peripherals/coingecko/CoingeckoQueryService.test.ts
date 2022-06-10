import {
  CoingeckoClient,
  CoingeckoId,
  EthereumAddress,
  getTimestamps,
  HttpClient,
  mock,
  UnixTimestamp,
  UNIX_DAY,
  UNIX_HOUR,
  UNIX_MINUTE,
} from '@l2beat/common'
import { expect, mockFn } from 'earljs'

import {
  COINGECKO_HOURLY_MAX_SPAN,
  CoingeckoQueryService,
  generateRangesToCallHourly,
  pickPrices,
  PriceHistoryPoint,
} from '../../../src/peripherals/coingecko/CoingeckoQueryService'

describe(CoingeckoQueryService.name, () => {
  describe(CoingeckoQueryService.prototype.getUsdPriceHistory.name, () => {
    it('is called with correct parameters', async () => {
      const coingeckoClient = mock<CoingeckoClient>({
        getCoinMarketChartRange: async () => ({
          marketCaps: [],
          totalVolumes: [],
          prices: [
            {
              timestamp: UnixTimestamp.now(),
              price: 1234567,
            },
          ],
        }),
      })
      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)
      const timestamp2021 = UnixTimestamp.fromDate(new Date('2021-01-01'))
      const timestamp2022 = UnixTimestamp.fromDate(new Date('2022-01-01'))
      await coingeckoQueryService.getUsdPriceHistory(
        CoingeckoId('bitcoin'),
        UnixTimestamp(+timestamp2021 - 5 * UNIX_MINUTE),
        UnixTimestamp(+timestamp2022 + 5 * UNIX_MINUTE),
        'daily'
      )
      expect(
        coingeckoClient.getCoinMarketChartRange
      ).toHaveBeenCalledExactlyWith([
        [
          CoingeckoId('bitcoin'),
          'usd',
          UnixTimestamp(+timestamp2021 - 7 * UNIX_DAY),
          UnixTimestamp(+timestamp2022 + 12 * UNIX_HOUR),
        ],
      ])
    })

    it('handles regular days range returned from API', async () => {
      const START = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))

      const coingeckoClient = mock<CoingeckoClient>({
        getCoinMarketChartRange: async () => ({
          prices: [
            { timestamp: START, price: 1200 },
            { timestamp: UnixTimestamp(+START + 1 * UNIX_DAY), price: 1000 },
            { timestamp: UnixTimestamp(+START + 2 * UNIX_DAY), price: 1100 },
          ],
          marketCaps: [],
          totalVolumes: [],
        }),
      })
      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)
      const prices = await coingeckoQueryService.getUsdPriceHistory(
        CoingeckoId('bitcoin'),
        START,
        UnixTimestamp(+START + 2 * UNIX_DAY),
        'daily'
      )
      expect(prices).toEqual([
        { timestamp: START, value: 1200, deltaSeconds: 0 },
        {
          timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
          value: 1000,
          deltaSeconds: 0,
        },
        {
          timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
          value: 1100,
          deltaSeconds: 0,
        },
      ])
    })

    it('handles multiple calls to get hourly', async () => {
      const START = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))

      const coingeckoClient = mock<CoingeckoClient>({
        getCoinMarketChartRange: mockFn(),
      })
      coingeckoClient.getCoinMarketChartRange
        .resolvesToOnce({
          prices: [
            { timestamp: START, price: 1200 },
            { timestamp: UnixTimestamp(+START + 30 * UNIX_DAY), price: 1000 },
            { timestamp: UnixTimestamp(+START + 60 * UNIX_DAY), price: 1400 },
            { timestamp: UnixTimestamp(+START + 80 * UNIX_DAY), price: 1800 },
          ],
          marketCaps: [],
          totalVolumes: [],
        })
        .resolvesToOnce({
          prices: [
            { timestamp: UnixTimestamp(+START + 80 * UNIX_DAY), price: 1800 },
            { timestamp: UnixTimestamp(+START + 90 * UNIX_DAY), price: 1700 },
            { timestamp: UnixTimestamp(+START + 120 * UNIX_DAY), price: 1900 },
            { timestamp: UnixTimestamp(+START + 150 * UNIX_DAY), price: 2000 },
            { timestamp: UnixTimestamp(+START + 160 * UNIX_DAY), price: 2400 },
          ],
          marketCaps: [],
          totalVolumes: [],
        })
        .resolvesToOnce({
          prices: [
            { timestamp: UnixTimestamp(+START + 160 * UNIX_DAY), price: 2400 },
            { timestamp: UnixTimestamp(+START + 180 * UNIX_DAY), price: 2600 },
          ],
          marketCaps: [],
          totalVolumes: [],
        })
      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)
      const prices = await coingeckoQueryService.getUsdPriceHistory(
        CoingeckoId('bitcoin'),
        START,
        UnixTimestamp(+START + 180 * UNIX_DAY),
        'hourly'
      )

      const timestamps = getTimestamps(
        START,
        UnixTimestamp(+START + 180 * UNIX_DAY),
        'hourly'
      )
      const constPrices = [
        { timestamp: START, price: 1200 },
        { timestamp: UnixTimestamp(+START + 30 * UNIX_DAY), price: 1000 },
        { timestamp: UnixTimestamp(+START + 60 * UNIX_DAY), price: 1400 },
        { timestamp: UnixTimestamp(+START + 80 * UNIX_DAY), price: 1800 },
        { timestamp: UnixTimestamp(+START + 90 * UNIX_DAY), price: 1700 },
        { timestamp: UnixTimestamp(+START + 120 * UNIX_DAY), price: 1900 },
        { timestamp: UnixTimestamp(+START + 150 * UNIX_DAY), price: 2000 },
        { timestamp: UnixTimestamp(+START + 160 * UNIX_DAY), price: 2400 },
        { timestamp: UnixTimestamp(+START + 180 * UNIX_DAY), price: 2600 },
      ]

      expect(prices).toEqual(pickPrices(constPrices, timestamps))
    })

    it('handles duplicates in data returned from API', async () => {
      const START = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))

      const coingeckoClient = mock<CoingeckoClient>({
        getCoinMarketChartRange: async () => ({
          prices: [
            { timestamp: START, price: 1200 },
            { timestamp: START, price: 1200 },
            { timestamp: UnixTimestamp(+START + 1 * UNIX_DAY), price: 1000 },
            { timestamp: UnixTimestamp(+START + 1 * UNIX_DAY), price: 1000 },
            { timestamp: UnixTimestamp(+START + 1 * UNIX_DAY), price: 1000 },
            { timestamp: UnixTimestamp(+START + 2 * UNIX_DAY), price: 1100 },
            { timestamp: UnixTimestamp(+START + 2 * UNIX_DAY), price: 1100 },
          ],
          marketCaps: [],
          totalVolumes: [],
        }),
      })
      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)
      const prices = await coingeckoQueryService.getUsdPriceHistory(
        CoingeckoId('bitcoin'),
        START,
        UnixTimestamp(+START + 2 * UNIX_DAY),
        'daily'
      )
      expect(prices).toEqual([
        { timestamp: START, value: 1200, deltaSeconds: 0 },
        {
          timestamp: UnixTimestamp(+START + 12 * UNIX_DAY),
          value: 1000,
          deltaSeconds: 0,
        },
        {
          timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
          value: 1100,
          deltaSeconds: 0,
        },
      ])
    })

    it('handles irregular days range returned from API', async () => {
      const START = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))

      const coingeckoClient = mock<CoingeckoClient>({
        getCoinMarketChartRange: async () => ({
          prices: [
            { timestamp: UnixTimestamp(+START - 2 * UNIX_HOUR), price: 1200 },
            { timestamp: UnixTimestamp(+START + 1 * UNIX_DAY), price: 1000 },
            {
              timestamp: UnixTimestamp(+START + 2 * UNIX_DAY + 2 * UNIX_HOUR),
              price: 1100,
            },
          ],
          marketCaps: [],
          totalVolumes: [],
        }),
      })
      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)
      const prices = await coingeckoQueryService.getUsdPriceHistory(
        CoingeckoId('bitcoin'),
        START,
        UnixTimestamp(+START + 2 * UNIX_DAY),
        'daily'
      )
      expect(prices).toEqual([
        { timestamp: START, value: 1200, deltaSeconds: -2 * 60 * 60 * 1000 },
        {
          timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
          value: 1000,
          deltaSeconds: 0,
        },
        {
          timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
          value: 1100,
          deltaSeconds: 2 * 60 * 60 * 1000,
        },
      ])
    })

    it('handles unsorted days range returned from API', async () => {
      const START = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))

      const coingeckoClient = mock<CoingeckoClient>({
        getCoinMarketChartRange: async () => ({
          prices: [
            { timestamp: UnixTimestamp(+START + 1 * UNIX_DAY), price: 1000 },
            { timestamp: START, price: 1200 },
            {
              timestamp: UnixTimestamp(+START + 2 * UNIX_DAY + 2 * UNIX_HOUR),
              price: 1100,
            },
          ],
          marketCaps: [],
          totalVolumes: [],
        }),
      })
      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)
      const prices = await coingeckoQueryService.getUsdPriceHistory(
        CoingeckoId('bitcoin'),
        START,
        UnixTimestamp(+START + 2 * UNIX_DAY),
        'daily'
      )
      expect(prices).toEqual([
        { timestamp: START, value: 1200, deltaSeconds: 0 },
        {
          timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
          value: 1000,
          deltaSeconds: 0,
        },
        {
          timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
          value: 1100,
          deltaSeconds: 2 * 60 * 60 * 1000,
        },
      ])
    })
  })

  describe(CoingeckoQueryService.prototype.getCoinIds.name, () => {
    it('called with correct parameters', async () => {
      const coingeckoClient = mock<CoingeckoClient>({
        getCoinList: async () => [],
      })

      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)

      await coingeckoQueryService.getCoinIds()
      expect(coingeckoClient.getCoinList).toHaveBeenCalledExactlyWith([
        [
          {
            includePlatform: true,
          },
        ],
      ])
    })

    it('list of coingeckoIds', async () => {
      const coingeckoClient = mock<CoingeckoClient>({
        getCoinList: async () => [
          {
            id: CoingeckoId('aave'),
            symbol: 'aave',
            name: 'Aave',
            platforms: {
              ethereum: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            },
          },
          {
            id: CoingeckoId('compound-governance-token'),
            symbol: 'comp',
            name: 'Compound',
            platforms: {
              ethereum: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
            },
          },
          {
            id: CoingeckoId('uniswap'),
            symbol: 'uni',
            name: 'Uniswap',
            platforms: {
              ethereum: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            },
          },
        ],
      })

      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)

      const coinsIds = await coingeckoQueryService.getCoinIds()

      expect(coinsIds).toEqual(
        new Map([
          [
            EthereumAddress('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'),
            CoingeckoId('aave'),
          ],
          [
            EthereumAddress('0xc00e94Cb662C3520282E6f5717214004A7f26888'),
            CoingeckoId('compound-governance-token'),
          ],
          [
            EthereumAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'),
            CoingeckoId('uniswap'),
          ],
        ])
      )
    })

    it('coin does not have ethereum address', async () => {
      const coingeckoClient = mock<CoingeckoClient>({
        getCoinList: async () => [
          {
            id: CoingeckoId('aave'),
            symbol: 'aave',
            name: 'Aave',
            platforms: {
              ethereum: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            } as Record<string, string | null>,
          },
          {
            id: CoingeckoId('compound-governance-token'),
            symbol: 'comp',
            name: 'Compound',
            platforms: {},
          },
          {
            id: CoingeckoId('uniswap'),
            symbol: 'uni',
            name: 'Uniswap',
            platforms: {},
          },
        ],
      })

      const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)

      const coinsIds = await coingeckoQueryService.getCoinIds()

      expect(coinsIds).toEqual(
        new Map([
          [
            EthereumAddress('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'),
            CoingeckoId('aave'),
          ],
        ])
      )
    })
  })
})

describe(pickPrices.name, () => {
  const START = UnixTimestamp(1517961600)

  it('works for days', () => {
    const prices = [
      { price: 1000, timestamp: START },
      { price: 1100, timestamp: UnixTimestamp(+START + 1 * UNIX_DAY) },
      { price: 1200, timestamp: UnixTimestamp(+START + 2 * UNIX_DAY) },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 2 * UNIX_DAY),
      'daily'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1000, timestamp: START, deltaSeconds: 0 },
      {
        value: 1100,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
        deltaSeconds: 0,
      },
      {
        value: 1200,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
        deltaSeconds: 0,
      },
    ])
  })

  it('works for hours', () => {
    const prices = [
      { price: 1000, timestamp: START },
      { price: 1100, timestamp: UnixTimestamp(+START + 1 * UNIX_HOUR) },
      { price: 1200, timestamp: UnixTimestamp(+START + 2 * UNIX_HOUR) },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 2 * UNIX_HOUR),
      'hourly'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1000, timestamp: START, deltaSeconds: 0 },
      {
        value: 1100,
        timestamp: UnixTimestamp(+START + 1 * UNIX_HOUR),
        deltaSeconds: 0,
      },
      {
        value: 1200,
        timestamp: UnixTimestamp(+START + 2 * UNIX_HOUR),
        deltaSeconds: 0,
      },
    ])
  })

  it('adjusts dates for slightly off timestamps', () => {
    const prices = [
      { price: 1000, timestamp: UnixTimestamp(+START + 2 * UNIX_MINUTE) },
      {
        price: 1100,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY + UNIX_MINUTE),
      },
      {
        price: 1200,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY + 3 * UNIX_MINUTE),
      },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 2 * UNIX_DAY),
      'daily'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1000, timestamp: START, deltaSeconds: 2 * 60 * 1000 },
      {
        value: 1100,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
        deltaSeconds: 1 * 60 * 1000,
      },
      {
        value: 1200,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
        deltaSeconds: 3 * 60 * 1000,
      },
    ])
  })

  it('adjusts dates before the first timestamp', () => {
    const prices = [
      { price: 1000, timestamp: UnixTimestamp(+START - 2 * UNIX_MINUTE) },
      { price: 1100, timestamp: UnixTimestamp(+START + 1 * UNIX_DAY) },
      { price: 1200, timestamp: UnixTimestamp(+START + 2 * UNIX_DAY) },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 2 * UNIX_DAY),
      'daily'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1000, timestamp: START, deltaSeconds: -2 * 60 * 1000 },
      {
        value: 1100,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
        deltaSeconds: 0,
      },
      {
        value: 1200,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
        deltaSeconds: 0,
      },
    ])
  })

  it('discards unnecessary data', () => {
    const prices = [
      { price: 1100, timestamp: UnixTimestamp(+START - 2 * UNIX_MINUTE) },
      { price: 1200, timestamp: UnixTimestamp(+START + 1 * UNIX_MINUTE) },
      { price: 1300, timestamp: UnixTimestamp(+START + 1 * UNIX_DAY) },
      {
        price: 1400,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY + 2 * UNIX_MINUTE),
      },
      {
        price: 1500,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY - 1 * UNIX_MINUTE),
      },
      {
        price: 1600,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY + 2 * UNIX_MINUTE),
      },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 2 * UNIX_DAY),
      'daily'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1200, timestamp: START, deltaSeconds: 1 * 60 * 1000 },
      {
        value: 1300,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
        deltaSeconds: 0,
      },
      {
        value: 1500,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
        deltaSeconds: -1 * 60 * 1000,
      },
    ])
  })

  it('manufactures single missing datapoint', () => {
    const prices = [
      { price: 1000, timestamp: START },
      {
        price: 1200,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY - UNIX_MINUTE),
      },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 2 * UNIX_DAY),
      'daily'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1000, timestamp: START, deltaSeconds: 0 },
      {
        value: 1200,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
        deltaSeconds: 24 * 60 * 60 * 1000 - 60 * 1000,
      },
      {
        value: 1200,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
        deltaSeconds: -60 * 1000,
      },
    ])
  })

  it('manufactures multiple missing datapoints', () => {
    const prices = [
      { price: 1000, timestamp: START },
      { price: 1400, timestamp: UnixTimestamp(+START + 4 * UNIX_DAY) },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 4 * UNIX_DAY),
      'daily'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1000, timestamp: START, deltaSeconds: 0 },
      {
        value: 1000,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
        deltaSeconds: -24 * 60 * 60 * 1000,
      },
      {
        value: 1400,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
        deltaSeconds: 48 * 60 * 60 * 1000,
      },
      {
        value: 1400,
        timestamp: UnixTimestamp(+START + 3 * UNIX_DAY),
        deltaSeconds: 24 * 60 * 60 * 1000,
      },
      {
        value: 1400,
        timestamp: UnixTimestamp(+START + 4 * UNIX_DAY),
        deltaSeconds: 0,
      },
    ])
  })

  it('manufactures start and end datapoints', () => {
    const prices = [
      { timestamp: UnixTimestamp(+START + 1 * UNIX_DAY), price: 1100 },
    ]
    const timestamps = getTimestamps(
      START,
      UnixTimestamp(+START + 2 * UNIX_DAY),
      'daily'
    )

    expect(pickPrices(prices, timestamps)).toEqual([
      { value: 1100, timestamp: START, deltaSeconds: 24 * 60 * 60 * 1000 },
      {
        value: 1100,
        timestamp: UnixTimestamp(+START + 1 * UNIX_DAY),
        deltaSeconds: 0,
      },
      {
        value: 1100,
        timestamp: UnixTimestamp(+START + 2 * UNIX_DAY),
        deltaSeconds: -24 * 60 * 60 * 1000,
      },
    ])
  })
})

describe(generateRangesToCallHourly.name, () => {
  it('30 days', () => {
    const start = UnixTimestamp.fromDate(new Date('2021-07-01T00:00:00Z'))

    expect(
      generateRangesToCallHourly(start, UnixTimestamp(+start + 30 * UNIX_DAY))
    ).toEqual([{ start: start, end: UnixTimestamp(+start + 30 * UNIX_DAY) }])
  })

  it('90 days', () => {
    const start = UnixTimestamp.fromDate(new Date('2021-07-01T00:00:00Z'))

    expect(
      generateRangesToCallHourly(start, UnixTimestamp(+start + 90 * UNIX_DAY))
    ).toEqual([
      { start: start, end: UnixTimestamp(+start + COINGECKO_HOURLY_MAX_SPAN) },
      {
        start: UnixTimestamp(+start + COINGECKO_HOURLY_MAX_SPAN),
        end: UnixTimestamp(+start + 90 * UNIX_DAY),
      },
    ])
  })

  it('180 days', () => {
    const start = UnixTimestamp.fromDate(new Date('2021-07-01T00:00:00Z'))

    expect(
      generateRangesToCallHourly(start, UnixTimestamp(+start + 180 * UNIX_DAY))
    ).toEqual([
      {
        start: start,
        end: UnixTimestamp(+start + COINGECKO_HOURLY_MAX_SPAN),
      },
      {
        start: UnixTimestamp(+start + COINGECKO_HOURLY_MAX_SPAN),
        end: UnixTimestamp(+start + 2 * COINGECKO_HOURLY_MAX_SPAN),
      },
      {
        start: UnixTimestamp(+start + 2 * COINGECKO_HOURLY_MAX_SPAN),
        end: UnixTimestamp(+start + 180 * UNIX_DAY),
      },
    ])
  })
})

describe.skip(CoingeckoQueryService.name + ' e2e tests', function () {
  this.timeout(100000)

  const COIN = CoingeckoId('ethereum')
  const START = UnixTimestamp.fromDate(new Date('2021-01-01T00:00:00Z'))
  const DAYS_SPAN = 90
  const MAX_THRESHOLD_MINUTES = 25
  const EXPECTED_HOURLY_FAULT_RATIO = 0.15

  const httpClient = new HttpClient()
  const coingeckoClient = new CoingeckoClient(httpClient)
  const coingeckoQueryService = new CoingeckoQueryService(coingeckoClient)

  it('daily', async () => {
    const data = await coingeckoQueryService.getUsdPriceHistory(
      COIN,
      START,
      UnixTimestamp(+START + DAYS_SPAN * UNIX_DAY),
      'daily'
    )

    const ratio = getFaultRatio(data)

    expect(ratio).toEqual(0)
  })

  it('hourly', async () => {
    const data = await coingeckoQueryService.getUsdPriceHistory(
      COIN,
      START,
      UnixTimestamp(+START + DAYS_SPAN * UNIX_DAY),
      'hourly'
    )

    const ratio = getFaultRatio(data)

    expect(ratio < EXPECTED_HOURLY_FAULT_RATIO).toEqual(true)

    console.log('Coin = ', COIN)
    console.log('Days span = ', DAYS_SPAN)
    console.log('Max fault [min] = ', MAX_THRESHOLD_MINUTES)
    console.log('=================')
    console.log('Fault ratio = ', Math.round(ratio * 100) / 100)
    console.log('Expected hourly fault ratio = ', EXPECTED_HOURLY_FAULT_RATIO)
    console.log('=================')

    let sum = 0
    data.forEach((point) => (sum += point.deltaSeconds))
    const average = sum / data.length

    console.log('Average fault [min] = ', average / 1000 / 60)

    let res = 0
    data.forEach((point) => (res += Math.pow(point.deltaSeconds - average, 2)))
    const deviation = Math.sqrt(res / data.length)
    console.log('Standard deviation [min] = ', deviation / 1000 / 60)
  })

  const getFaultRatio = (data: PriceHistoryPoint[]) => {
    const faultyData = data
      .map((i) => i.deltaSeconds / 1000 / 60)
      .filter((i) => i > MAX_THRESHOLD_MINUTES)

    return faultyData.length / data.length
  }
})
