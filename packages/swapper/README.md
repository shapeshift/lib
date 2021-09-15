## ShapeShift Swapper

## Getting Started

```sh
yarn add @shapeshiftoss/swapper
```

## Usage

### Setup

```ts
import { SwapperManager, SwapperType, ZrxSwapper } from '@shapeshiftoss/swapper'

// in code
const manager = new SwapperManager<MyCustomSwapperTypes>()

// Add a swapper to the manager, you can add your own if they follow the `Swapper` api spec
manager.addSwapper(SwapperType.Zrx, () => new ZrxSwapper())
```

### Working with the manager

```ts
// Get best quote and swapper for a trading pair
const { swapperType, quote } = await manager.getBestQuote(asset1, asset2)

// Get the swapper and do stuff
const swapper = manager.bySwapper(swapperType)
```

### Working with a specific swapper

```ts
// Get a specific swapper from the manager
const swapper = manager.bySwapper(SwapperType.Zrx)

// Get a list of supported assets/trading pairs
const assets = await swapper.getSupportedAssets()

// Get a specific swapper from the manager
const quote = await swapper.getQuote()

// Execute a Trade
const txToSign = await swapper.buildTransaction()

// Sign your TX
// const signedTx = adapter.signTransaction(...args)

const tx = await swapper.execute(signedTx)
```
