import { AssetId, EthereumAddress, Logger, UnixTimestamp } from '@l2beat/common'
import { Knex } from 'knex'
import { ReportRow } from 'knex/types/tables'

import { BaseRepository } from './BaseRepository'

export interface ReportRecord {
  blockNumber: bigint
  timestamp: UnixTimestamp
  bridge: EthereumAddress
  asset: AssetId
  usdTVL: bigint
  ethTVL: bigint
  balance: bigint
}

export class ReportRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)

    this.getDaily = this.wrapGet(this.getDaily)
    this.getAll = this.wrapGet(this.getAll)
    this.addOrUpdateMany = this.wrapAddMany(this.addOrUpdateMany)
    this.deleteAll = this.wrapDelete(this.deleteAll)
  }

  async getDaily(): Promise<ReportRecord[]> {
    const rows = await this.knex('reports')
      .select()
      .where('is_daily', '=', true)
      .orderBy('unix_timestamp')

    return rows.map((r) => toRecord(r))
  }

  async getAll(): Promise<ReportRecord[]> {
    const rows = await this.knex('reports').select()
    return rows.map(toRecord)
  }

  async addOrUpdateMany(reports: ReportRecord[]) {
    const rows = reports.map(toRow)
    return await this.knex('reports')
      .insert(rows)
      .returning(['block_number', 'bridge_address', 'asset_id'])
      .onConflict(['block_number', 'bridge_address', 'asset_id'])
      .merge()
  }

  async deleteAll() {
    return await this.knex('reports').delete()
  }
}

function toRow(record: ReportRecord): ReportRow {
  return {
    block_number: Number(record.blockNumber),
    unix_timestamp: record.timestamp.toString(),
    bridge_address: record.bridge.toString(),
    asset_id: record.asset.toString(),
    balance: record.balance.toString(),
    usd_tvl: record.usdTVL.toString(),
    eth_tvl: record.ethTVL.toString(),
    is_daily: UnixTimestamp.isExact(UnixTimestamp.DAY, record.timestamp),
  }
}

function toRecord(row: ReportRow): ReportRecord {
  return {
    blockNumber: BigInt(row.block_number),
    timestamp: UnixTimestamp(+row.unix_timestamp),
    bridge: EthereumAddress.unsafe(row.bridge_address),
    asset: AssetId(row.asset_id),
    balance: BigInt(row.balance),
    usdTVL: BigInt(row.usd_tvl),
    ethTVL: BigInt(row.eth_tvl),
  }
}
