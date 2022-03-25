export type BuildTxInput = {
  gas: string
  fee: string
}

export type Validator = {
  address: string
}

export type Delegation = {
  assetId: string
  amount: string
  validator: Validator
}

export type RedelegationEntry = {
  assetId: string
  completionTime: number
  amount: string
}

export type Redelegation = {
  destinationValidator: Validator
  sourceValidator: Validator
  entries: RedelegationEntry[]
}

export type UndelegationEntry = {
  assetId: string
  completionTime: number
  amount: string
}

export type Undelegation = {
  validator: Validator
  entries: UndelegationEntry[]
}

export type Reward = {
  assetId: string
  amount: string
}

export type Account = {
  sequence: string
  accountNumber: string
  delegations: Delegation[]
  redelegations: Redelegation[]
  undelegations: Undelegation[]
  rewards: Reward[]
}

export type FeeData = {
  gasLimit: string
}
