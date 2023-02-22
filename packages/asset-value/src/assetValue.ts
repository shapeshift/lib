import { AssetId } from '@shapeshiftoss/caip'
import { BigNumber } from 'bignumber.js'
import { Md5 } from 'ts-md5'

import { CHECKSUM_LENGTH, DEFAULT_FORMAT_DECIMALS } from './constants'
import { AssetValueParams, isAssetValueParams, SerializedAssetValue } from './types'
import { AssetValueFormat } from './types'
import { bn, bnOrZero } from './utils'

type AssetValueState = {
  assetId: AssetId
  precision: number
  value: string
}

//TODO(pastaghost): Add JSDoc documentation
export class AssetValue {
  state: AssetValueState

  public constructor(params: AssetValueParams | SerializedAssetValue) {
    if (isAssetValueParams(params)) {
      if (params.asset && !(params.asset.assetId?.length && params.asset.precision > -1)) {
        throw new Error('Cannot initialize AssetValue with invalid asset')
      }

      if (!params.asset && !(params.assetId?.length && params.precision > -1)) {
        throw new Error('Cannot initialize AssetValue with invalid asset')
      }

      let _value: string
      switch (params.format) {
        case AssetValueFormat.BASE_UNIT:
          _value = bnOrZero(params.value).toFixed(0, BigNumber.ROUND_DOWN)
          break
        case AssetValueFormat.PRECISION:
          _value = bnOrZero(params.value)
            .multipliedBy(bn(10).pow(params.asset ? params.asset.precision : params.precision))
            .toString()
          break
      }
      this.state = {
        assetId: params.asset ? params.asset.assetId : params.assetId,
        precision: params.asset ? params.asset.precision : params.precision,
        value: _value,
      }
    } else {
      this.loadSerializedAssetValue(params as SerializedAssetValue)
    }
  }

  public get assetId(): AssetId {
    return this.state.assetId
  }

  public get precision(): number {
    return this.state.precision
  }

  public plus(term: AssetValue): AssetValue {
    this.assertIsSameAsset(term, 'add')

    const value = bnOrZero(this.state.value).plus(bnOrZero(term.toBaseUnit())).toFixed()
    return new AssetValue({
      value,
      assetId: this.state.assetId,
      precision: this.state.precision,
      format: AssetValueFormat.BASE_UNIT,
    })
  }

  public minus(term: AssetValue): AssetValue {
    this.assertIsSameAsset(term, 'subtract')

    const value = bnOrZero(this.state.value).minus(bnOrZero(term.toBaseUnit())).toFixed()
    return new AssetValue({
      value,
      assetId: this.state.assetId,
      precision: this.state.precision,
      format: AssetValueFormat.BASE_UNIT,
    })
  }

  public multipliedBy(factor: string | number): AssetValue {
    const value = bnOrZero(this.state.value).multipliedBy(bnOrZero(factor)).toFixed()
    return new AssetValue({
      value,
      assetId: this.state.assetId,
      precision: this.state.precision,
      format: AssetValueFormat.BASE_UNIT,
    })
  }

  public dividedBy(factor: string | number): AssetValue {
    const value = bnOrZero(this.state.value).dividedBy(bnOrZero(factor)).toFixed()
    return new AssetValue({
      value,
      assetId: this.state.assetId,
      precision: this.state.precision,
      format: AssetValueFormat.BASE_UNIT,
    })
  }

  public negated(): AssetValue {
    const value = bnOrZero(this.state.value).negated().toFixed()
    return new AssetValue({
      value,
      assetId: this.state.assetId,
      precision: this.state.precision,
      format: AssetValueFormat.BASE_UNIT,
    })
  }

  public isGreaterThan(term: AssetValue): boolean {
    this.assertIsSameAsset(term, 'compare')
    return bnOrZero(this.state.value).gt(bnOrZero(term.toBaseUnit()))
  }

  public isGreaterThanOrEqualTo(term: AssetValue): boolean {
    this.assertIsSameAsset(term, 'compare')
    return bnOrZero(this.state.value).gte(bnOrZero(term.toBaseUnit()))
  }

  public isLessThan(term: AssetValue): boolean {
    this.assertIsSameAsset(term, 'compare')
    return bnOrZero(this.state.value).lt(bnOrZero(term.toBaseUnit()))
  }

  public isLessThanOrEqualTo(term: AssetValue): boolean {
    this.assertIsSameAsset(term, 'compare')
    return bnOrZero(this.state.value).lte(bnOrZero(term.toBaseUnit()))
  }

  public isEqualTo(term: AssetValue): boolean {
    this.assertIsSameAsset(term, 'compare')
    return this.state.value === term.toBaseUnit()
  }

  public isNegative(): boolean {
    return bnOrZero(this.state.value).isNegative()
  }

  public isZero(): boolean {
    return bnOrZero(this.state.value).isZero()
  }

  public toBaseUnit(): string {
    return this.state.value
  }

  public toPrecision(decimals?: number | string): string {
    const _decimals = Number(decimals ?? Math.min(this.state.precision, DEFAULT_FORMAT_DECIMALS))
    return bnOrZero(this.state.value)
      .dividedBy(bn(10).pow(bnOrZero(this.state.precision)))
      .toFixed(_decimals)
  }

  public toFixed(decimalPlaces?: number, roundingMode?: BigNumber.RoundingMode): string {
    if (decimalPlaces) {
      return bnOrZero(this.toPrecision()).toFixed(decimalPlaces, roundingMode)
    }
    return bnOrZero(this.toPrecision()).toFixed()
  }

  public toSerialized(): SerializedAssetValue {
    const serializedState = JSON.stringify({
      a: this.state.assetId,
      p: this.state.precision,
      v: this.state.value,
    })
    const hash = Md5.hashStr(serializedState).slice(0, CHECKSUM_LENGTH)
    return `${serializedState}|${hash}` as SerializedAssetValue
  }

  public mult = this.multipliedBy.bind(this)
  public div = this.dividedBy.bind(this)
  public gte = this.isGreaterThanOrEqualTo.bind(this)
  public lt = this.isLessThan.bind(this)
  public lte = this.isLessThanOrEqualTo.bind(this)
  public eq = this.isEqualTo.bind(this)
  public base = this.toBaseUnit.bind(this)
  public prec = this.toPrecision.bind(this)

  private loadSerializedAssetValue(value: SerializedAssetValue) {
    const [serializedState, hash] = value.split('|')
    if (!(serializedState && hash)) {
      throw new Error('Cannot initialize AssetValue from improperly-formatted SerializedAssetValue')
    }
    const parsedState = JSON.parse(serializedState)
    if (!(parsedState && parsedState.a && parsedState.p && parsedState.v)) {
      throw new Error('Cannot initialize AssetValue from underspecified SerializedAssetValue')
    }
    const _hash = Md5.hashStr(serializedState).slice(0, CHECKSUM_LENGTH)
    if (_hash !== hash) {
      throw new Error(`Invalid checksum for SerializedAssetValue. Expected ${_hash}.`)
    }
    this.state = {
      assetId: parsedState.a,
      precision: parsedState.p,
      value: parsedState.v,
    }
  }

  private assertIsSameAsset(asset: AssetValue, op: string) {
    if (!(asset.assetId === this.assetId && asset.precision === this.precision)) {
      throw new Error(
        `Cannot ${op} assets of different type (${asset.assetId} and ${this.assetId})`,
      )
    }
  }
}

export class AV extends AssetValue {}
