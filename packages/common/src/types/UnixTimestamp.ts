export interface UnixTimestamp extends Number {
  _UnixTimestampBrand: number
}

export function UnixTimestamp(secondsSince1970: number) {
  if (!Number.isSafeInteger(secondsSince1970)) {
    throw new Error('Cannot create a UnixTimestamp from an unsafe integer')
  }
  return secondsSince1970 as unknown as UnixTimestamp
}

export const UNIX_MINUTE = 60
export const UNIX_HOUR = 60 * UNIX_MINUTE
export const UNIX_DAY = 24 * UNIX_HOUR

UnixTimestamp.now = function now() {
  return UnixTimestamp.fromDate(new Date())
}

UnixTimestamp.fromMilliseconds = function fromMilliseconds(
  millisecondsSince1970: number
) {
  if (!Number.isSafeInteger(millisecondsSince1970)) {
    throw new Error('Cannot create a UnixTimestamp from an unsafe integer')
  }
  const seconds = Math.floor(millisecondsSince1970 / 1000)
  return UnixTimestamp(seconds)
}

UnixTimestamp.fromDate = function fromDate(date: Date) {
  return UnixTimestamp.fromMilliseconds(date.getTime())
}

UnixTimestamp.toMilliseconds = function toMilliseconds(
  timestamp: UnixTimestamp
) {
  return +timestamp * 1000
}

UnixTimestamp.toDate = function toDate(timestamp: UnixTimestamp) {
  return new Date(UnixTimestamp.toMilliseconds(timestamp))
}

UnixTimestamp.roundDownTo = function roundDownTo(
  period: number,
  timestamp: UnixTimestamp
) {
  return UnixTimestamp(+timestamp - (+timestamp % period))
}

UnixTimestamp.roundUpTo = function roundUpTo(
  period: number,
  timestamp: UnixTimestamp
) {
  const offset = +timestamp % period
  if (offset === 0) {
    return timestamp
  }
  return UnixTimestamp(+timestamp + period - offset)
}

UnixTimestamp.isExact = function isExact(
  period: number,
  timestamp: UnixTimestamp
) {
  return +timestamp % period === 0
}
