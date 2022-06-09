import { Logger, UnixTimestamp } from '@l2beat/common'
import { expect } from 'earljs'

import { BlockNumberRepository } from '../../../src/peripherals/database/BlockNumberRepository'
import { setupDatabaseTestSuite } from './setup'

describe(BlockNumberRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()

  it('can delete all records', async () => {
    const repository = new BlockNumberRepository(knex, Logger.SILENT)
    await repository.deleteAll()
    const results = await repository.getAll()
    expect(results).toEqual([])
  })

  it('can add new records', async () => {
    const repository = new BlockNumberRepository(knex, Logger.SILENT)

    const itemA = { blockNumber: 1234n, timestamp: UnixTimestamp.fromSeconds(5678) }
    const itemB = { blockNumber: 7777n, timestamp: UnixTimestamp.fromSeconds(222222) }

    await repository.add(itemA)
    await repository.add(itemB)

    const results = await repository.getAll()

    expect(results).toBeAnArrayWith(itemA, itemB)
    expect(results.length).toEqual(2)
  })
})
