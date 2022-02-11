import axios from 'axios'
import _ from 'lodash'

export const getCosmosData = async () => {
  const { data } = await axios.get('https://tokens.coingecko.com/uniswap/all.json')

  return _.map([])
}
