import { expect } from 'earljs'

import { UNIX_HOUR, UNIX_MINUTE, UnixTimestamp } from '../../src/types'
import { getTimestamps } from '../../src/utils/getTimestamps'

describe(getTimestamps.name, () => {
  describe('hourly', () => {
    const GRANULARITY = 'hourly'
    const FROM = UnixTimestamp.fromDate(new Date('2021-09-07T13:00:00Z'))
    const TO = UnixTimestamp.fromDate(new Date('2021-09-07T15:00:00Z'))

    const RESULT = [
      FROM,
      UnixTimestamp.fromDate(new Date('2021-09-07T14:00:00Z')),
      TO,
    ]

    it('throws if FROM greater than TO', () => {
      expect(() => getTimestamps(TO, FROM, GRANULARITY)).toThrow(
        'FROM cannot be greater than TO'
      )
    })

    it('13:00 to 15:00', () => {
      expect(getTimestamps(FROM, TO, GRANULARITY)).toEqual(RESULT)
    })

    it('13:01 to 15:01', () => {
      expect(
        getTimestamps(
          UnixTimestamp(+FROM + UNIX_MINUTE),
          UnixTimestamp(+TO + UNIX_MINUTE),
          GRANULARITY
        )
      ).toEqual([
        UnixTimestamp.fromDate(new Date('2021-09-07T14:00:00Z')),
        UnixTimestamp.fromDate(new Date('2021-09-07T15:00:00Z')),
      ])
    })

    it('23:00 to 01:00', () => {
      const from = UnixTimestamp.fromDate(new Date('2021-09-07T23:00:00Z'))
      const to = UnixTimestamp.fromDate(new Date('2021-09-08T01:00:00Z'))
      const result = [
        from,
        UnixTimestamp.fromDate(new Date('2021-09-08T00:00:00Z')),
        to,
      ]

      expect(getTimestamps(from, to, GRANULARITY)).toEqual(result)
    })
  })

  describe('daily', () => {
    const GRANULARITY = 'daily'
    const FROM = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))
    const TO = UnixTimestamp.fromDate(new Date('2021-09-09T00:00:00Z'))

    const RESULT = [
      FROM,
      UnixTimestamp.fromDate(new Date('2021-09-08T00:00:00Z')),
      TO,
    ]

    it('throws if FROM greater than TO', () => {
      expect(() => getTimestamps(TO, FROM, GRANULARITY)).toThrow(
        'FROM cannot be greater than TO'
      )
    })

    it('07.09.2021 00:00 to 09.09.2021 00:00', () => {
      expect(getTimestamps(FROM, TO, GRANULARITY)).toEqual(RESULT)
    })

    it('07.09.2021 01:00 to 09.09.2021 01:00', () => {
      expect(
        getTimestamps(
          UnixTimestamp(+FROM + UNIX_HOUR),
          UnixTimestamp(+TO + UNIX_HOUR),
          GRANULARITY
        )
      ).toEqual([
        UnixTimestamp.fromDate(new Date('2021-09-08T00:00:00Z')),
        UnixTimestamp.fromDate(new Date('2021-09-09T00:00:00Z')),
      ])
    })
  })
})
