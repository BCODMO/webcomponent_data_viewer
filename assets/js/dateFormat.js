/**
 * Description: Convert a Javascript Date object into a string using a Frictionless date format
 * @param:  date is the Date object
 * @param:  format is the Frictionless date format
 * @return: a date or datetime string via moment
 */
function dateFormat(date, format) {
  return moment(date).format(convertDatetimeFormatFromFDtoJS(format))
}

/*
 * Description: Convert a python format string to javascript format string
 * Example:     "%m/%d/%Y" to "MM/DD/YYYY"
 * @param:  formatStr is the python format string
 * @return: the javascript format string
 */
function convertDatetimeFormatFromFDtoJS(formatStr) {
  for (const key in DATETIME_FORMATS_MAP_FROM_FD_TO_JS) {
    formatStr = formatStr.split(key).join(DATETIME_FORMATS_MAP_FROM_FD_TO_JS[key])
  }
  return formatStr
}

/* Key: Python format
 * Value: Javascript format
 */
const DATETIME_FORMATS_MAP_FROM_FD_TO_JS = Object.freeze({
  '%A': 'dddd', // Weekday as locale’s full name: (In English: Sunday, .., Saturday)(Auf Deutsch: Sonntag, .., Samstag)
  '%a': 'ddd', // Weekday abbreivated: (In English: Sun, .., Sat)(Auf Deutsch: So, .., Sa)
  '%B': 'MMMM', // Month name: (In English: January, .., December)(Auf Deutsch: Januar, .., Dezember)
  '%b': 'MMM', // Month name abbreviated: (In English: Jan, .., Dec)(Auf Deutsch: Jan, .., Dez)
  '%c': 'ddd MMM DD HH:mm:ss YYYY', // Locale’s appropriate date and time representation: (English: Sun Oct 13 23:30:00 1996)(Deutsch: So 13 Oct 22:30:00 1996)
  '%d': 'DD', // Day 0 padded: (01, .., 31)
  '%f': 'SSS', // Microseconds 0 padded: (000000, .., 999999)
  '%H': 'HH', // Hour (24-Hour) 0 padded: (00, .., 23)
  '%I': 'hh', // Hour (12-Hour) 0 padded: (01, .., 12)
  '%j': 'DDDD', // Day of Year 0 padded: (001, .., 366)
  '%M': 'mm', // Minute 0 padded: (01, .. 59)
  '%m': 'MM', // Month 0 padded: (01, .., 12)
  '%p': 'A', // Locale equivalent of AM/PM: (EN: AM, PM)(DE: am, pm)
  '%S': 'ss', // Second 0 padded: (00, .., 59)
  '%U': 'ww', // Week # of Year (Sunday): (00, .., 53)  All days in a new year preceding the first Sunday are considered to be in week 0.
  '%W': 'ww', // Week # of Year (Monday): (00, .., 53)  All days in a new year preceding the first Monday are considered to be in week 0.
  '%w': 'd', // Weekday as #: (0, 6)
  '%X': 'HH:mm:ss', // Locale's appropriate time representation: (EN: 23:30:00)(DE: 23:30:00)
  '%x': 'MM/DD/YYYY', // Locale's appropriate date representation: (None: 02/14/16)(EN: 02/14/16)(DE: 14.02.16)
  '%Y': 'YYYY', // Year as #: (1970, 2000, 2038, 292,277,026,596)
  '%y': 'YY', // Year without century 0 padded: (00, .., 99)
  '%Z': 'z', // Time zone name: ((empty), UTC, EST, CST) (empty string if the object is naive).
  '%z': 'ZZ', // UTC offset in the form +HHMM or -HHMM: ((empty), +0000, -0400, +1030) Empty string if the the object is naive.
  '%%': '%', // A literal '%' character: (%)
})
