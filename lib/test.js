import { format, utcToZonedTime } from 'date-fns-tz'
import { getUnixTime, parseISO } from 'date-fns'
import locale from 'date-fns/locale/en-GB'
const fmt = (d, timeZone) =>
  format(
    utcToZonedTime(d, timeZone),
    'yyyy-MM-dd\'T\'HH:mm:ss (zzz)',
    { timeZone, locale })

import dsl from './lib/dsl'
import schedule from './lib/schedule'

const parsed = dsl(`

  start: now/M
  end: now+4M/M

  // the first tuesday of every month
  result:
  + interval(now/M, +7d, 1M)

`,
'America/New_York')
console.log(parsed.constants)
const segments = schedule(
  parsed.schedules,
  parsed.schedules.result,
  {
    start: parsed.constants.start,
    end: parsed.constants.end
  },
  'America/New_York')
for (let segment of segments) {
  console.log(`${fmt(segment.start, 'America/New_York')} — ${fmt(segment.end, 'America/New_York')}`)
}