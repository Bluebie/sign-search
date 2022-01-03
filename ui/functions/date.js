const months = 'January February March April May June July August September October November December'.split(' ')
const numSuffixes = ['th', 'st', 'nd', 'rd', 'th']
const weekdays = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ')

/**
 * Format a epoch in milliseconds or a date in to a nice humane format: "Thursday, 23rd December 2021"
 * @param {number|Date} timestamp
 * @returns {string}
 */
exports.humane = function humane (timestamp) {
  const date = new Date(timestamp)
  const dayOfWeek = weekdays[date.getDay()]
  const day = date.getDate()
  const suffix = numSuffixes[Math.min(day % 10, 4)]
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${dayOfWeek}, ${day}${suffix} ${month} ${year}`
}

/**
 * Format a epoch in milliseconds or a date in to an iso timestamp string
 * @param {number|Date} timestamp
 * @returns {string}
 */
exports.iso = function iso (timestamp) {
  return (new Date(timestamp)).toISOString()
}
