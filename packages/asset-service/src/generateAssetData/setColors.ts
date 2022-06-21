import { Asset } from '@shapeshiftoss/types'
import colorThief from 'colorthief'

const toHex = (num: number): string => num.toString(16).toUpperCase().padStart(2, '0')

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
