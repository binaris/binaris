/* eslint-disable radix */
const moment = require('moment');

// the official units recognized by the momentjs
const secondUnit = 'second';
const minuteUnit = 'minute';
const hourUnit = 'hour';
const dayUnit = 'date';

/** allowed CLI->time unit bindings */
const timeReprMap = {
  s: secondUnit,
  sec: secondUnit,
  second: secondUnit,
  seconds: secondUnit,
  m: minuteUnit,
  min: minuteUnit,
  min: minuteUnit,
  minute: minuteUnit,
  minutes: minuteUnit,
  h: hourUnit,
  hr: hourUnit,
  hour: hourUnit,
  hours: hourUnit,
  d: dayUnit,
  day: dayUnit,
  days: dayUnit,
};

// simple regex which verifies if a certain timestring
// is only composed of numbers
const onlyNumeric = /^[0-9]+$/g;

const offsetFormat = /^[0-9]+[a-z]+$/g;

/**
 * Converts a offset format timestring to its representation
 * in milliseconds.
 *
 * Valid examples:
 *
 * '2h'
 * '3hours'
 * '4w'
 * '5days'
 * etc...
 *
 * @param {string} offset - string representing offset time
 * @return {integer} - the string offset value in 'ms'
 */
const fromOffset = function fromOffset(offset) {
  // match the first occurrence of numbers until but not
  // including the first non number
  const timePart = offset.match(/[0-9]+.*?(?=[^0-9])/);
  const realTime = parseInt(timePart);
  // not even sure this path can be reached due to the regex
  if (isNaN(realTime)) {
    throw new Error(`Invalid offset format "${offset}", time portion was ${realTime}`);
  }
  // match the first(and only) group of lowercase letters
  const textPart = offset.match(/[a-z]+/);
  // does the user time format string have a registered mapping
  const textRepr = timeReprMap[textPart];
  if (!textRepr || !textPart) {
    throw new Error(`Invalid offset format, unknown unit "${offset.slice(timePart.toString().length, offset.length)}"`);
  }
  // current time and then subtract the user offset
  const calculatedTime = moment();
  calculatedTime.subtract(realTime, textRepr);
  return calculatedTime.valueOf();
};

/**
 * Parses the provided timestring if it is one of the four
 * acceptable formats(RFC822, ISO8061, unix timestamp, and
 * finally 'simple time format').
 *
 * @param {string} timeString - timestamp to parse
 *
 * @returns {number} - unix time parsed from a timestamp
 */
const parseTimeString = function parseTimeString(timeString) {
  const attemptISO = moment(timeString, moment.ISO_8601);
  // TODO(Ry): add debug log that shows final time in ms
  if (onlyNumeric.test(timeString)) {
    const parsedNumber = parseInt(timeString.replace('.', ''));
    const timestamp = moment.unix(parsedNumber);
    if (timestamp.isValid()) {
      return timestamp.valueOf();
    }
    throw new Error(`Invalid numeric timestamp format "${timeString}"`);
  } else if (attemptISO.isValid()) {
    return attemptISO.valueOf();
  } else if (offsetFormat.test(timeString)) {
    return fromOffset(timeString);
  }
  throw new Error(`Invalid time format "${timeString}"`);
};

module.exports = {
  parseTimeString,
};
