import { deposit } from './routerCallData'

const ROUTER = '0x3624525075b88b24ecc29ce226b0cec1ffcb6976'
const VAULT = '0x78E4E10dCAcB0A8261eB3D5e57fFb98AE8D4dFF1'

describe('routerCallData', () => {
  it('should create valid trade data for the deposit() call', async () => {
    const data = await deposit(
      ROUTER,
      VAULT,
      '0x0000000000000000000000000000000000000000',
      '70000000000000000',
      `s:ETH.USDC-9D4A2E9EB0CE3606EB48:0x8a65ac0E23F31979db06Ec62Af62b132a6dF4741:420`
    )

    // expected data same as an actual thorchain trade
    // https://etherscan.io/tx/0x517306df8ba18c36759de15e7d663f813ae15b3afd1a442c1f70904b246f4d7e
    const expectedData =
      '0x1fece7b400000000000000000000000078e4e10dcacb0a8261eb3d5e57ffb98ae8d4dff1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f8b0a10e4700000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004e733a4554482e555344432d39443441324539454230434533363036454234383a3078386136356163304532334633313937396462303645633632416636326231333261366446343734313a343230000000000000000000000000000000000000'
    expect(data).toEqual(expectedData)
  })
})
