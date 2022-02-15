// 50 requests per minute as per https://www.coingecko.com/en/api/documentation
export const COINGECKO_MAX_RPM = 50
// 200 requests per minute as per https://docs.coincap.io/ "Limits" section
export const COINCAP_MAX_RPM = 200
// 500 requests per minute as yearn api has no limits, see https://github.com/shapeshift/lib/pull/368#issuecomment-1039722564
export const YEARN_MAX_RPM = 500
