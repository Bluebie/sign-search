// polyfill Array#at() on old platforms
if (!Array.prototype.at) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'at', {
    value: function (index) {
      const O = Object(this)
      return (index < 0) ? O[O.length + index] : O[index]
    }
  })
}
