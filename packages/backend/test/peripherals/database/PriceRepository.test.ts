import { CoingeckoId, Logger, UnixTimestamp } from '@l2beat/common'
import { expect } from 'earljs'

import { PriceRepository } from '../../../src/peripherals/database/PriceRepository'
import { setupDatabaseTestSuite } from './setup'

describe(PriceRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new PriceRepository(knex, Logger.SILENT)

  const START = UnixTimestamp.now()
  const DATA = [
    {
      priceUsd: 3000,
      timestamp: UnixTimestamp(+START - UnixTimestamp.HOUR),
      coingeckoId: CoingeckoId('ethereum'),
    },
    {
      priceUsd: 3100,
      timestamp: UnixTimestamp(+START - 2 * UnixTimestamp.HOUR),
      coingeckoId: CoingeckoId('ethereum'),
    },
    {
      priceUsd: 20,
      timestamp: UnixTimestamp(+START - UnixTimestamp.HOUR),
      coingeckoId: CoingeckoId('uniswap'),
    },
    {
      priceUsd: 22,
      timestamp: UnixTimestamp(+START - 2 * UnixTimestamp.HOUR),
      coingeckoId: CoingeckoId('uniswap'),
    },
    {
      priceUsd: 1,
      timestamp: START,
      coingeckoId: CoingeckoId('dai'),
    },
  ]

  beforeEach(async () => {
    await repository.deleteAll()
    await repository.addOrUpdate(DATA)
  })

  describe(PriceRepository.prototype.addOrUpdate.name, () => {
    it('only new rows', async () => {
      const newRows = [
        {
          priceUsd: 3300,
          timestamp: UnixTimestamp(
            +UnixTimestamp.now() - 3 * UnixTimestamp.HOUR
          ),
          coingeckoId: CoingeckoId('ethereum'),
        },
        {
          priceUsd: 3500,
          timestamp: UnixTimestamp(
            +UnixTimestamp.now() - 4 * UnixTimestamp.HOUR
          ),
          coingeckoId: CoingeckoId('ethereum'),
        },
      ]
      await repository.addOrUpdate(newRows)

      const results = await repository.getAll()
      expect(results).toBeAnArrayWith(...DATA, ...newRows)
      expect(results).toBeAnArrayOfLength(7)
    })

    it('only existing rows', async () => {
      const existingRows = [
        {
          priceUsd: 3000.1,
          timestamp: DATA[0].timestamp,
          coingeckoId: DATA[0].coingeckoId,
        },
        {
          priceUsd: 3100.1,
          timestamp: DATA[1].timestamp,
          coingeckoId: DATA[1].coingeckoId,
        },
      ]
      await repository.addOrUpdate(existingRows)

      const results = await repository.getAll()
      expect(results).toBeAnArrayWith(
        DATA[2],
        DATA[3],
        ...existingRows,
        DATA[4]
      )
      expect(results).toBeAnArrayOfLength(5)
    })

    it('mixed: new and existing rows', async () => {
      const mixedRows = [
        {
          priceUsd: 3000.1,
          timestamp: DATA[1].timestamp,
          coingeckoId: DATA[1].coingeckoId,
        },
        {
          priceUsd: 3300.1,
          timestamp: UnixTimestamp(
            +UnixTimestamp.now() - 3 * UnixTimestamp.HOUR
          ),
          coingeckoId: CoingeckoId('ethereum'),
        },
      ]

      await repository.addOrUpdate(mixedRows)
      const results = await repository.getAll()
      expect(results).toBeAnArrayWith(
        DATA[0],
        DATA[2],
        DATA[3],
        ...mixedRows,
        DATA[4]
      )
      expect(results).toBeAnArrayOfLength(6)
    })
  })

  it(PriceRepository.prototype.getAll.name, async () => {
    const results = await repository.getAll()

    expect(results).toBeAnArrayWith(...DATA)
    expect(results).toBeAnArrayOfLength(5)
  })

  it(PriceRepository.prototype.getByTimestamp.name, async () => {
    const timestamp = UnixTimestamp(+START - UnixTimestamp.HOUR)
    const results = await repository.getByTimestamp(timestamp)

    expect(results).toBeAnArrayWith(DATA[0], DATA[2])
  })

  it(PriceRepository.prototype.getByToken.name, async () => {
    const token = CoingeckoId('uniswap')
    const results = await repository.getByToken(token)

    expect(results).toBeAnArrayWith(
      ...DATA.filter((d) => d.coingeckoId === token)
    )
    expect(results).toBeAnArrayOfLength(2)
  })

  it(PriceRepository.prototype.deleteAll.name, async () => {
    await repository.deleteAll()

    const results = await repository.getAll()

    expect(results).toBeAnArrayOfLength(0)
  })

  describe(PriceRepository.prototype.calcDataBoundaries.name, () => {
    it('boundary of single and multi row data', async () => {
      const result = await repository.calcDataBoundaries()

      expect(result).toEqual(
        new Map([
          [
            CoingeckoId('ethereum'),
            {
              earliest: UnixTimestamp(+START - 2 * UnixTimestamp.HOUR),
              latest: UnixTimestamp(+START - UnixTimestamp.HOUR),
            },
          ],
          [
            CoingeckoId('uniswap'),
            {
              earliest: UnixTimestamp(+START - 2 * UnixTimestamp.HOUR),
              latest: UnixTimestamp(+START - UnixTimestamp.HOUR),
            },
          ],
          [
            CoingeckoId('dai'),
            {
              earliest: START,
              latest: START,
            },
          ],
        ])
      )
    })
  })
})
