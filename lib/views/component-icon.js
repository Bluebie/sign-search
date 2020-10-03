const html = require('nanohtml')

module.exports = (name) => {
  return html`<svg class="${`icon icon-${name}`}" aria-hidden="true">
    <use xlink:href="${`style/assets/icomoon/symbol-defs.svg#icon-${name}`}"></use>
  </svg>`
}
