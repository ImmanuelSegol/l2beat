import { expect } from 'earljs'

import {
  UNIX_DAY,
  UNIX_HOUR,
  UNIX_MINUTE,
  UnixTimestamp,
} from '../../src/types'

describe('UnixTimestamp', () => {
  it('can be created from seconds', () => {
    const timestamp = UnixTimestamp(1234)
    expect(+timestamp).toEqual(1234)
  })

  it('cannot be created from fractional seconds', () => {
    expect(() => UnixTimestamp(1234.5)).toThrow(expect.stringMatching('unsafe'))
  })

  it('can be created from milliseconds', () => {
    const timestamp = UnixTimestamp.fromMilliseconds(1234567)
    expect(+timestamp).toEqual(1234)
  })

  it('cannot be created from fractional milliseconds', () => {
    expect(() => UnixTimestamp.fromMilliseconds(1234567.89)).toThrow(
      expect.stringMatching('unsafe')
    )
  })

  it('can be created from a date', () => {
    const date = new Date()
    const timestamp = UnixTimestamp.fromDate(date)
    expect(+timestamp).toEqual(Math.floor(date.getTime() / 1000))
  })

  it('can be converted to milliseconds', () => {
    const timestamp = UnixTimestamp(1234)
    const milliseconds = UnixTimestamp.toMilliseconds(timestamp)
    expect(milliseconds).toEqual(1234000)
  })

  it('can be converted to a date', () => {
    const timestamp = UnixTimestamp(1234)
    const date = UnixTimestamp.toDate(timestamp)
    expect(date).toEqual(new Date(1234000))
  })

  describe(UnixTimestamp.roundDownTo.name, () => {
    it('day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.roundDownTo(UNIX_DAY, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T00:00:00Z')
      )
    })

    it('beginning of a day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))
      const result = UnixTimestamp.roundDownTo(UNIX_DAY, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T00:00:00Z')
      )
    })

    it('hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.roundDownTo(UNIX_HOUR, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:00:00Z')
      )
    })

    it('beginning of an hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:00:00Z'))
      const result = UnixTimestamp.roundDownTo(UNIX_HOUR, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:00:00Z')
      )
    })

    it('minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.roundDownTo(UNIX_MINUTE, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:34:00Z')
      )
    })

    it('beginning of a minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:00Z'))
      const result = UnixTimestamp.roundDownTo(UNIX_MINUTE, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:34:00Z')
      )
    })
  })

  describe(UnixTimestamp.roundUpTo.name, () => {
    it('day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.roundUpTo(UNIX_DAY, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-08T00:00:00Z')
      )
    })

    it('begging of a day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-08T00:00:00Z'))
      const result = UnixTimestamp.roundUpTo(UNIX_DAY, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-08T00:00:00Z')
      )
    })

    it('hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.roundUpTo(UNIX_HOUR, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T13:00:00Z')
      )
    })

    it('beginning of an hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:00:00Z'))
      const result = UnixTimestamp.roundUpTo(UNIX_HOUR, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:00:00Z')
      )
    })

    it('minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.roundUpTo(UNIX_MINUTE, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:35:00Z')
      )
    })

    it('beginning of a minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:00Z'))
      const result = UnixTimestamp.roundUpTo(UNIX_MINUTE, timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:34:00Z')
      )
    })
  })

  describe(UnixTimestamp.isExact.name, () => {
    it('full day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-08T00:00:00Z'))
      expect(UnixTimestamp.isExact(UNIX_DAY, timestamp)).toEqual(true)
    })

    it('not full day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-08T10:13:51Z'))
      expect(UnixTimestamp.isExact(UNIX_DAY, timestamp)).toEqual(false)
    })

    it('full hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:00:00Z'))
      expect(UnixTimestamp.isExact(UNIX_HOUR, timestamp)).toEqual(true)
    })

    it('not full hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:01:10Z'))
      expect(UnixTimestamp.isExact(UNIX_HOUR, timestamp)).toEqual(false)
    })

    it('full minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:10:00Z'))
      expect(UnixTimestamp.isExact(UNIX_MINUTE, timestamp)).toEqual(true)
    })

    it('not full minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:10:01Z'))
      expect(UnixTimestamp.isExact(UNIX_MINUTE, timestamp)).toEqual(false)
    })
  })
})
