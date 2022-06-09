import { UnixTimestamp } from '../types'

type Granularity = 'daily' | 'hourly'

const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86400

export function getTimestamps(
  from: UnixTimestamp,
  to: UnixTimestamp,
  granularity: Granularity
): UnixTimestamp[] {
  if (from > to) throw new Error('FROM cannot be greater than TO')

  const [start, end] = adjust(from, to, granularity)

  const result: UnixTimestamp[] = []
  const TIME_STEP =
    granularity === 'hourly' ? SECONDS_PER_HOUR : SECONDS_PER_DAY
  for (let i = +start; i <= +end; i += TIME_STEP) {
    result.push(UnixTimestamp.fromSeconds(i))
  }
  return result
}

function adjust(
  from: UnixTimestamp,
  to: UnixTimestamp,
  granularity: Granularity
) {
  const period = granularity === 'hourly' ? 'hour' : 'day'
  return [
    UnixTimestamp.isExact(period, from)
      ? from
      : UnixTimestamp.toStartOfNext(period, from),
    UnixTimestamp.isExact(period, to)
      ? to
      : UnixTimestamp.toStartOf(period, to),
  ]
}
