import { expect } from 'earljs'

import { UnixTimestamp } from '../../src/types'

describe('UnixTimestamp', () => {
  it('can be created from seconds', () => {
    const timestamp = UnixTimestamp.fromSeconds(1234)
    expect(+timestamp).toEqual(1234)
  })

  it('cannot be created from fractional seconds', () => {
    expect(() => UnixTimestamp.fromSeconds(1234.5)).toThrow(
      expect.stringMatching('unsafe')
    )
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
    const timestamp = UnixTimestamp.fromSeconds(1234)
    const milliseconds = UnixTimestamp.toMilliseconds(timestamp)
    expect(milliseconds).toEqual(1234000)
  })

  it('can be converted to a date', () => {
    const timestamp = UnixTimestamp.fromSeconds(1234)
    const date = UnixTimestamp.toDate(timestamp)
    expect(date).toEqual(new Date(1234000))
  })

  describe(UnixTimestamp.add.name, () => {
    it('can add days', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))
      const result = UnixTimestamp.add(3, 'days', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-10T00:00:00Z')
      )
    })

    it('can add hours', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))
      const result = UnixTimestamp.add(5, 'hours', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T05:00:00Z')
      )
    })

    it('can add minutes', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))
      const result = UnixTimestamp.add(4, 'minutes', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T00:04:00Z')
      )
    })

    it('can add seconds', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))
      const result = UnixTimestamp.add(6, 'seconds', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T00:00:06Z')
      )
    })
  })

  describe(UnixTimestamp.toStartOf.name, () => {
    it('day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.toStartOf('day', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T00:00:00Z')
      )
    })

    it('beginning of a day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T00:00:00Z'))
      const result = UnixTimestamp.toStartOf('day', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T00:00:00Z')
      )
    })

    it('hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.toStartOf('hour', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:00:00Z')
      )
    })

    it('beginning of an hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:00:00Z'))
      const result = UnixTimestamp.toStartOf('hour', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:00:00Z')
      )
    })

    it('minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.toStartOf('minute', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:34:00Z')
      )
    })

    it('beginning of a minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:00Z'))
      const result = UnixTimestamp.toStartOf('minute', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:34:00Z')
      )
    })
  })

  describe(UnixTimestamp.toStartOfNext.name, () => {
    it('day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.toStartOfNext('day', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-08T00:00:00Z')
      )
    })

    it('begging of a day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-08T00:00:00Z'))
      const result = UnixTimestamp.toStartOfNext('day', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-09T00:00:00Z')
      )
    })

    it('hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.toStartOfNext('hour', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T13:00:00Z')
      )
    })

    it('beginning of an hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:00:00Z'))
      const result = UnixTimestamp.toStartOfNext('hour', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T13:00:00Z')
      )
    })

    it('minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:56Z'))
      const result = UnixTimestamp.toStartOfNext('minute', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:35:00Z')
      )
    })

    it('beginning of a minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:34:00Z'))
      const result = UnixTimestamp.toStartOfNext('minute', timestamp)
      expect(UnixTimestamp.toDate(result)).toEqual(
        new Date('2021-09-07T12:35:00Z')
      )
    })
  })

  describe(UnixTimestamp.isExact.name, () => {
    it('full day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-08T00:00:00Z'))
      expect(UnixTimestamp.isExact('day', timestamp)).toEqual(true)
    })

    it('not full day', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-08T10:13:51Z'))
      expect(UnixTimestamp.isExact('day', timestamp)).toEqual(false)
    })

    it('full hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:00:00Z'))
      expect(UnixTimestamp.isExact('hour', timestamp)).toEqual(true)
    })

    it('not full hour', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:01:10Z'))
      expect(UnixTimestamp.isExact('hour', timestamp)).toEqual(false)
    })

    it('full minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:10:00Z'))
      expect(UnixTimestamp.isExact('minute', timestamp)).toEqual(true)
    })

    it('not full minute', () => {
      const timestamp = UnixTimestamp.fromDate(new Date('2021-09-07T12:10:01Z'))
      expect(UnixTimestamp.isExact('minute', timestamp)).toEqual(false)
    })
  })
})
