// Get specific type for key(K) in union(T)
type ValueOfUnion<T, K> = T extends unknown ? (K extends keyof T ? T[K] : undefined) : never

// Get all keys in union(T) as union
type KeysOfUnion<T> = T extends unknown ? keyof T : never

// Create mapping of all keys in union(T) with underlying type values for each key guaranteeing correct index types
// note "| keyof" index is simply to tell typescript that T is definitely a sub type of KeysOfUnion
type UnionMapping<T> = {
  [K in KeysOfUnion<T> | keyof T]: ValueOfUnion<T, K>
}

// Pick out the elements we know for sure and make everything else optional
type UnionMerge<T> = Pick<UnionMapping<T>, keyof T> & Partial<UnionMapping<T>>

export type ChainSpecificNested<T, M> = UnionMerge<
  T extends unknown ? (T extends keyof M ? { chainSpecific: M[T] } : undefined) : never
>

export type ChainSpecificFlat<T, M> = UnionMerge<
  T extends unknown ? (T extends keyof M ? M[T] : undefined) : never
>
