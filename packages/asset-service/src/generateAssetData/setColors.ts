import { Asset } from '@shapeshiftoss/types'
import colorThief from 'colorthief'

function toHex(num: number): string {
  const hex = num.toString(16).toUpperCase()
  return hex.length === 1 ? `0${hex}` : hex
}

export const setColors = async (assets: Asset[]): Promise<Asset[]> => {
  for (let i = 0; i < assets.length - 1; i++) {
    try {
      if (assets[i].color === '#FFFFFF' && assets[i].icon) {
        // colorThief.getColor returns the most dominant color in the icon.
        const [r, g, b] = await colorThief.getColor(assets[i].icon)
        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`
        assets[i].color = hexColor
      }
    } catch (err) {
      console.info(
        `${i + 1}/${assets.length} Could not get color for ${assets[i].assetId} iconUrl: ${
          assets[i].icon
        }`
      )
    }
  }
  return assets
}
