import BN from 'bn.js'

function isHexPrefixed(str: string): boolean {
  if (typeof str !== 'string') {
    throw new Error(
      "[is-hex-prefixed] value must be type 'string', is currently type " +
        typeof str +
        ', while checking isHexPrefixed.'
    )
  }

  return str.slice(0, 2) === '0x'
}

function stripHexPrefix<T>(str: T): T
function stripHexPrefix(str: unknown): unknown {
  if (typeof str !== 'string') {
    return str
  }

  return isHexPrefixed(str) ? str.slice(2) : str
}

function numberToBN(
  arg: string | number | (BN & Partial<Record<'pop' | 'push' | 'dividedToIntegerBy', unknown>>)
): BN {
  if (typeof arg === 'string' || typeof arg === 'number') {
    var multiplier = new BN(1); // eslint-disable-line
    const formattedString = String(arg)
      .toLowerCase()
      .trim()
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const isHexPrefixed =
      formattedString.substr(0, 2) === '0x' || formattedString.substr(0, 3) === '-0x'
    var stringArg = stripHexPrefix(formattedString); // eslint-disable-line
    if (stringArg.substr(0, 1) === '-') {
      stringArg = stripHexPrefix(stringArg.slice(1))
      multiplier = new BN(-1, 10)
    }
    stringArg = stringArg === '' ? '0' : stringArg

    if (
      (!stringArg.match(/^-?[0-9]+$/) && stringArg.match(/^[0-9A-Fa-f]+$/)) ||
      stringArg.match(/^[a-fA-F]+$/) ||
      (isHexPrefixed === true && stringArg.match(/^[0-9A-Fa-f]+$/))
    ) {
      return new BN(stringArg, 16).mul(multiplier)
    }

    if ((stringArg.match(/^-?[0-9]+$/) || stringArg === '') && isHexPrefixed === false) {
      return new BN(stringArg, 10).mul(multiplier)
    }
  } else if (typeof arg === 'object' && arg.toString && !arg.pop && !arg.push) {
    if (arg.toString(10).match(/^-?[0-9]+$/) && (arg.mul || arg.dividedToIntegerBy)) {
      return new BN(arg.toString(10), 10)
    }
  }

  throw new Error(
    '[number-to-bn] while converting number ' +
      JSON.stringify(arg) +
      ' to BN.js instance, error: invalid number value. Value must be an integer, hex string, BN or BigNumber instance. Note, decimals are not supported.'
  )
}

function isHexStrict(hex: unknown): boolean {
  return (
    (typeof hex === 'string' || typeof hex === 'number') &&
    /^(-)?0x[0-9a-f]*$/i.test(hex.toString())
  )
}

function toBN(number: number | string | BN): BN {
  try {
    return numberToBN(number)
  } catch (e) {
    throw new Error(e + ' Given value: "' + number + '"')
  }
}

export function numberToHex(value: string | number | BN): string {
  if (value === null || value === undefined) return value

  if (!isFinite(Number(value)) && !isHexStrict(value)) {
    throw new Error(`Given input "${value}" is not a number.`)
  }

  const number = toBN(value)
  const result = number.toString(16)

  return number.lt(new BN(0)) ? '-0x' + result.substr(1) : '0x' + result
}
