// builds map icons representing which regions a sign is used in
const config = require('../../package.json').signSearch
const html = require('nanohtml')

class MapComponent {
  constructor(activeRegions) {
    this.activeRegions = activeRegions
    this.url = `style/assets/${config.signLang}-map.svg`
  }

  setActive(regions) {
    this.activeRegions = regions
  }

  hasActiveRegions() {
    return this.activeRegions.some(x => config.regions.includes(x))
  }

  toHTML() {
    let regions = config.regions.map(regionName => 
      html`<use xlink:href="${this.url}#${regionName}" class="${this.activeRegions.includes(regionName)?'active region':'region'}"></use>`
    )
    return html`<svg class="map-component">${regions}</svg>`
  }

  static htmlForRegions(regions) {
    let component = new MapComponent(regions)
    if (component.hasActiveRegions()) {
      return component.toHTML()
    } else {
      return null
    }
  }
}

module.exports = MapComponent