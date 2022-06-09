export interface UnixTimestamp extends Number {
  _UnixTimestampBrand: number
}

export const UnixTimestamp = {
  now() {
    return UnixTimestamp.fromDate(new Date())
  },

  fromSeconds(secondsSince1970: number) {
    if (!Number.isSafeInteger(secondsSince1970)) {
      throw new Error('Cannot create a UnixTimestamp from an unsafe integer')
    }
    return secondsSince1970 as unknown as UnixTimestamp
  },

  fromMilliseconds(millisecondsSince1970: number) {
    if (!Number.isSafeInteger(millisecondsSince1970)) {
      throw new Error('Cannot create a UnixTimestamp from an unsafe integer')
    }
    const seconds = Math.floor(millisecondsSince1970 / 1000)
    return UnixTimestamp.fromSeconds(seconds)
  },

  fromDate(date: Date) {
    return UnixTimestamp.fromMilliseconds(date.getTime())
  },

  toMilliseconds(timestamp: UnixTimestamp) {
    return +timestamp * 1000
  },

  toDate(timestamp: UnixTimestamp) {
    return new Date(UnixTimestamp.toMilliseconds(timestamp))
  },

  add(
    count: number,
    period: 'days' | 'hours' | 'minutes' | 'seconds',
    timestamp: UnixTimestamp
  ) {
    if (!Number.isSafeInteger(count)) {
      throw new TypeError('Cannot add an unsafe integer to UnixTimestamp')
    }
    const unit =
      period === 'days'
        ? SECONDS_PER_DAY
        : period === 'hours'
        ? SECONDS_PER_HOUR
        : period === 'minutes'
        ? SECONDS_PER_MINUTE
        : 1
    return UnixTimestamp.fromSeconds(+timestamp + count * unit)
  },

  toStartOf(period: 'day' | 'hour' | 'minute', timestamp: UnixTimestamp) {
    const modulus =
      period === 'day'
        ? SECONDS_PER_DAY
        : period === 'hour'
        ? SECONDS_PER_HOUR
        : SECONDS_PER_MINUTE
    return UnixTimestamp.fromSeconds(+timestamp - (+timestamp % modulus))
  },

  toStartOfNext(period: 'day' | 'hour' | 'minute', timestamp: UnixTimestamp) {
    const modulus =
      period === 'day'
        ? SECONDS_PER_DAY
        : period === 'hour'
        ? SECONDS_PER_HOUR
        : SECONDS_PER_MINUTE
    const remaining = modulus - (+timestamp % modulus)
    return UnixTimestamp.fromSeconds(+timestamp + remaining)
  },

  isExact(period: 'day' | 'hour' | 'minute', timestamp: UnixTimestamp) {
    const modulus =
      period === 'day'
        ? SECONDS_PER_DAY
        : period === 'hour'
        ? SECONDS_PER_HOUR
        : SECONDS_PER_MINUTE
    return +timestamp % modulus === 0
  },
}

export const SECONDS_PER_DAY = 86_400
export const SECONDS_PER_HOUR = 3_600
export const SECONDS_PER_MINUTE = 60
