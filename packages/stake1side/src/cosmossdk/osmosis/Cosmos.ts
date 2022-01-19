import { StakeActionInput, Staker, StakingInfo } from '../../api'
import { ConstructorArgs, SdkBaseStaker } from './SdkBase'

export class CosmosStaker extends SdkBaseStaker implements Staker {
  constructor(args: ConstructorArgs) {
    super(args)
  }

  async stake(input: StakeActionInput): Promise<string> {
    return super.stake(input)
  }

  async unstake(input: StakeActionInput): Promise<string> {
    return super.unstake(input)
  }

  async claim(input: StakeActionInput): Promise<string> {
    return super.unstake(input)
  }

  async getInfo(input: string): Promise<StakingInfo> {
    return super.getInfo(input)
  }
}
