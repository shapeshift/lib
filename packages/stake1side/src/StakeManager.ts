import { Staker } from './api'

export class StakerManager {
  stakers: Map<string, Staker>

  constructor() {
    this.stakers = new Map()
  }

  addStaker(key: string, Instance: Staker) {
    const staker = this.stakers.get(key)
    if (staker) throw new Error(`Staker with key: ${key} already exists`)
    this.stakers.set(key, Instance)
    return this
  }

  getStaker(key: string) {
    const staker = this.stakers.get(key)
    if (!staker) throw new Error(`Staker with key: ${key} doesn't exist`)
    return staker
  }
}
