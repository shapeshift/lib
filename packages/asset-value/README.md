# @shapeshiftoss/asset-value

This package provides an arithmetic and formatting class used to store the numerical value of an [Asset](https://github.com/shapeshift/lib/blob/9286cf2c27835d766719298ae688e0805448b00f/packages/asset-service/src/service/AssetService.ts#L10).

## Getting Started

```shell
yarn add @shapeshiftoss/asset-value
```

## Usage

### Format Conversion

Initialize an `AssetValue` instance with an `Asset` or `AssetId` and value, and specify the initial representation of the value.

```typescript
// Initialization using Asset
const asset: Asset = {
  assetId: 'cosmos:osmosis-1/ibc:gamm/pool/1',
  chainId: 'cosmos:osmosis-1',
  symbol: 'gamm/pool/1',
  name: 'Osmosis OSMO/ATOM LP Token',
  precision: 6,
  color: '#750BBB',
  icon: 'https://rawcdn.githack.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
  explorer: 'https://www.mintscan.io/osmosis',
  explorerAddressLink: 'https://www.mintscan.io/osmosis/account/',
  explorerTxLink: 'https://www.mintscan.io/osmosis/txs/',
}
const av1 = new AssetValue({ value: '42', asset: asset, format: AssetValueFormat.BASE_UNIT })

// Initialization using AssetId
const av2 = new AssetValue({
  value: '420',
  assetId: 'cosmos:osmosis-1/ibc:118',
  precision: 6,
  format: AssetValueFormat.PRECISION,
})
```

</br>
Converting a string containing numerical value in baseunit representation to precision representation is cumbersome and error-prone.

```typescript
import { AssetValue } from '@shapeshiftoss/asset-value'

// Converting a string in baseunit representation to precision representation
const underlyingAsset0AmountPrecision = bnOrZero(asset0AmountBaseUnit)
  .dividedBy(bn(10).pow(lpAsset.precision ?? '0'))
  .toString()
```

With AssetValue instances, this is much simpler. Just call the `toPrecision()` formatting method of the AssetValue.

```typescript
import { AssetValue } from '@shapeshiftoss/asset-value'

const underlyingAsset0Amount: string = asset0Amount.toPrecision()
```

Likewise, for a string contining the numerical value in baseunit representation, call the `toBaseUnit()` formatting method of the AssetValue.

```typescript
import { AssetValue } from '@shapeshiftoss/asset-value'

const underlyingAsset0Amount: string = asset0Amount.toBaseUnit()
```

### Math

The AssetValue class keeps track of the appropriate precision for the value based on the asset used to initialize the instance. This way, you don't need to keep track of which set of units the value is in or what the correct precision for the asset is. In fact, there is no longer any concept of precision or baseunit representations for values. You can perform arbitrary arithmetic operations on AssetValues as needed and then call whichever formatting method is appropriate when you need a string representation of the value.

</br>

Math operations are performed on AssetValue instances as if they were [bignumbers](https://mikemcl.github.io/bignumber.js/).

```typescript
import { AssetValue } from '@shapeshiftoss/asset-value'

// Arithmetic operations return a new AssetValue instance
const result: AssetValue = av1.plus(av2)
const negativeValue: AssetValue = av1.negated()

// Scalar operations like multiplication and division take a string or number as the argument
const product: AssetValue = av1.multipliedBy('100')
const percent: AssetValue = av1.dividedBy(100)
```

### Redux

For Redux-compatibility, AssetValues are serializable.
Call the `toSerialized()` method of any `AssetValue` to get a `SerializedAssetValue` containing the state of the `AssetValue`

```typescript
import { AssetValue, SerializedAssetValue } from '@shapeshiftoss/asset-value'

const state: SerializedAssetValue = av.toSerialized()
```

</br>

The `SerializedAssetValue` objects can be directly inserted into a Redux store, or used as an intermediate representation to be passed between React components and Redux via selectors and reducers.

```typescript
// selector.ts
export const selectAccountBalancesByAccountId(state, id: AccountId){
    const balances = state.portfolio.accountBalances.ById[id]
    return Object.entries(balances).map((assetId: AssetId, balance: string) => {
            const asset = state.assets[id]
            return new AssetValue(asset, value: balance, format: AssetValueFormat.BASE_UNIT).toSerialized()
    })
}

// Component.tsx
const serializedBalanceData = useAppSelector(state => selectAccountBalancesByAccountId(state, accountId))
const doubledBalances: AssetValue[] = serializedBalanceData.map(data: SerializedAssetValue => {
    return (new AssetValue(data)).multipliedBy(2)
})

const serializedDoubledBalanceData: SerializedAssetValue[] = doubledBalances.map(balance => balance.toSerialized())

dispatch({
    type: ComponentActionType.SET_BALANCES_FOR_ACCOUNT_ID,
    payload: {
        accountId,
        balances: serializedDoubledBalanceData
    }
})

// reducer.ts
const reducer = {
    state: ComponentState,
    action: ComponentActionType
}: ComponentState => {
    switch(action.type){
        case SET_BALANCES_FOR_ACCOUNT_ID:
            const accountBalances = {[action.payload.id]: action.payload.balances}
            return {...state, balances: {...state.balances, accountBalances}}
            break;
        default:
            return state
    }
}
```
