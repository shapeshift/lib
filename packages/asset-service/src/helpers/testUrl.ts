import axios from 'axios'
export const testUrl = async (url: string) => {
  try {
    await axios.head(url)
    return true
  } catch (error) {
    return false
  }
}
