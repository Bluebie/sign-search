/**
 * Delay until promise resolves
 * @param {number} duration milliseconds
 * @returns {Promise} resolves after duration is met
 */
export default function delay (duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), duration)
  })
}
