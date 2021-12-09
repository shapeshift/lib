import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'

import { toCAIP19 } from './../../caip19/caip19'
import { CAIP19ToYearn, yearnToCAIP19 } from '.'

describe('yearn adapter', () => {
  describe('yearnToCAIP19', () => {
    it('can get CAIP19 for bitcoin', () => {
      const chain = ChainTypes.Bitcoin
      const network = NetworkTypes.MAINNET
      const caip19 = toCAIP19({ chain, network })
      expect(yearnToCAIP19('bitcoin')).toEqual(caip19)
    })

    it('can get CAIP19 id for ethereum', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const caip19 = toCAIP19({ chain, network })
      expect(yearnToCAIP19('ethereum')).toEqual(caip19)
    })

    it('can get CAIP19 id for FOX', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const contractType = ContractTypes.ERC20
      const tokenId = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const caip19 = toCAIP19({ chain, network, contractType, tokenId })
      expect(yearnToCAIP19('shapeshift-fox-token')).toEqual(caip19)
    })
  })

  describe('CAIP19toYearn', () => {
    it('can get yearn id for bitcoin CAIP19', () => {
      const chain = ChainTypes.Bitcoin
      const network = NetworkTypes.MAINNET
      const caip19 = toCAIP19({ chain, network })
      expect(CAIP19ToYearn(caip19)).toEqual('bitcoin')
    })

    it('can get yearn id for ethereum CAIP19', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const caip19 = toCAIP19({ chain, network })
      expect(CAIP19ToYearn(caip19)).toEqual('ethereum')
    })

    it('can get yearn id for FOX', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const contractType = ContractTypes.ERC20
      const tokenId = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const caip19 = toCAIP19({ chain, network, contractType, tokenId })
      expect(CAIP19ToYearn(caip19)).toEqual('shapeshift-fox-token')
    })
  })
})
