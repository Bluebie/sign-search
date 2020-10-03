module.exports = (text) => {
  if (text.length > 1 && text.match(/^[A-Z0-9]$/)) return text.trim()
  return text.trim().toLowerCase()
}
