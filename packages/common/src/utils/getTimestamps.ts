import { UnixTimestamp } from '../types'

type Granularity = 'daily' | 'hourly'

export function getTimestamps(
  from: UnixTimestamp,
  to: UnixTimestamp,
  granularity: Granularity
): UnixTimestamp[] {
  if (from > to) throw new Error('FROM cannot be greater than TO')

  const [start, end] = adjust(from, to, granularity)

  const result: UnixTimestamp[] = []
  const TIME_STEP =
    granularity === 'hourly' ? UnixTimestamp.HOUR : UnixTimestamp.DAY
  for (let i = +start; i <= +end; i += TIME_STEP) {
    result.push(UnixTimestamp(i))
  }
  return result
}

function adjust(
  from: UnixTimestamp,
  to: UnixTimestamp,
  granularity: Granularity
) {
  const period =
    granularity === 'hourly' ? UnixTimestamp.HOUR : UnixTimestamp.DAY
  return [
    UnixTimestamp.roundUpTo(period, from),
    UnixTimestamp.roundDownTo(period, to),
  ]
}
