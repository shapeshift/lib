/* eslint-disable prettier/prettier */
import { ChainTypes } from '@shapeshiftoss/types'

import { ChainAdapter as IChainAdapter } from '../../api'
import { CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'
export class ChainAdapter extends CosmosSdkBaseAdapter<ChainTypes.Osmosis>
  implements IChainAdapter<ChainTypes.Osmosis> {
  }
