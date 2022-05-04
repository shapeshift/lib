/* tslint:disable */
/* eslint-disable */
/**
 * @shapeshiftoss/ethereum-api
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 6.10.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import { Configuration } from './configuration';
import globalAxios, { AxiosPromise, AxiosInstance } from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from './base';

/**
 * Contains info about a 400 Bad Request response
 * @export
 * @interface BadRequestError
 */
export interface BadRequestError {
    /**
     * 
     * @type {string}
     * @memberof BadRequestError
     */
    error: string;
}
/**
 * Contains additional ethereum specific info
 * @export
 * @interface EthereumAccount
 */
export interface EthereumAccount {
    /**
     * 
     * @type {string}
     * @memberof EthereumAccount
     */
    balance: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumAccount
     */
    unconfirmedBalance: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumAccount
     */
    pubkey: string;
    /**
     * 
     * @type {number}
     * @memberof EthereumAccount
     */
    nonce: number;
    /**
     * 
     * @type {Array<TokenBalance>}
     * @memberof EthereumAccount
     */
    tokens: Array<TokenBalance>;
}
/**
 * Contains info about an Ethereum transaction
 * @export
 * @interface EthereumTx
 */
export interface EthereumTx {
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    txid: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    blockHash?: string;
    /**
     * 
     * @type {number}
     * @memberof EthereumTx
     */
    blockHeight?: number;
    /**
     * 
     * @type {number}
     * @memberof EthereumTx
     */
    timestamp?: number;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    from: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    to: string;
    /**
     * 
     * @type {number}
     * @memberof EthereumTx
     */
    confirmations: number;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    value: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    fee: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    gasLimit: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    gasUsed?: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    gasPrice: string;
    /**
     * 
     * @type {number}
     * @memberof EthereumTx
     */
    status: number;
    /**
     * 
     * @type {string}
     * @memberof EthereumTx
     */
    inputData?: string;
    /**
     * 
     * @type {Array<TokenTransfer>}
     * @memberof EthereumTx
     */
    tokenTransfers?: Array<TokenTransfer>;
}
/**
 * Contains info about Ethereum transaction history
 * @export
 * @interface EthereumTxHistory
 */
export interface EthereumTxHistory {
    /**
     * 
     * @type {string}
     * @memberof EthereumTxHistory
     */
    cursor?: string;
    /**
     * 
     * @type {string}
     * @memberof EthereumTxHistory
     */
    pubkey: string;
    /**
     * 
     * @type {Array<EthereumTx>}
     * @memberof EthereumTxHistory
     */
    txs: Array<EthereumTx>;
}
/**
 * Contains info about current recommended fees to use in a transaction
 * @export
 * @interface GasFees
 */
export interface GasFees {
    /**
     * 
     * @type {string}
     * @memberof GasFees
     */
    gasPrice: string;
    /**
     * 
     * @type {string}
     * @memberof GasFees
     */
    maxFeePerGas: string;
    /**
     * 
     * @type {string}
     * @memberof GasFees
     */
    maxPriorityFeePerGas: string;
}
/**
 * Contains info about the running coinstack
 * @export
 * @interface Info
 */
export interface Info {
    /**
     * 
     * @type {string}
     * @memberof Info
     */
    network: string;
}
/**
 * Contains info about a 500 Internal Server Error response
 * @export
 * @interface InternalServerError
 */
export interface InternalServerError {
    /**
     * 
     * @type {string}
     * @memberof InternalServerError
     */
    message: string;
}
/**
 * Contains the serialized raw transaction hex
 * @export
 * @interface SendTxBody
 */
export interface SendTxBody {
    /**
     * 
     * @type {string}
     * @memberof SendTxBody
     */
    hex: string;
}
/**
 * Contains info about a token including balance for an address
 * @export
 * @interface TokenBalance
 */
export interface TokenBalance {
    /**
     * 
     * @type {string}
     * @memberof TokenBalance
     */
    contract: string;
    /**
     * 
     * @type {number}
     * @memberof TokenBalance
     */
    decimals: number;
    /**
     * 
     * @type {string}
     * @memberof TokenBalance
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof TokenBalance
     */
    symbol: string;
    /**
     * 
     * @type {string}
     * @memberof TokenBalance
     */
    type: string;
    /**
     * 
     * @type {string}
     * @memberof TokenBalance
     */
    balance: string;
}
/**
 * Contains info about a token including transfer details
 * @export
 * @interface TokenTransfer
 */
export interface TokenTransfer {
    /**
     * 
     * @type {string}
     * @memberof TokenTransfer
     */
    contract: string;
    /**
     * 
     * @type {number}
     * @memberof TokenTransfer
     */
    decimals: number;
    /**
     * 
     * @type {string}
     * @memberof TokenTransfer
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof TokenTransfer
     */
    symbol: string;
    /**
     * 
     * @type {string}
     * @memberof TokenTransfer
     */
    type: string;
    /**
     * 
     * @type {string}
     * @memberof TokenTransfer
     */
    from: string;
    /**
     * 
     * @type {string}
     * @memberof TokenTransfer
     */
    to: string;
    /**
     * 
     * @type {string}
     * @memberof TokenTransfer
     */
    value: string;
}
/**
 * Contains info about a transaction
 * @export
 * @interface Tx
 */
export interface Tx {
    /**
     * 
     * @type {string}
     * @memberof Tx
     */
    txid: string;
    /**
     * 
     * @type {string}
     * @memberof Tx
     */
    blockHash?: string;
    /**
     * 
     * @type {number}
     * @memberof Tx
     */
    blockHeight?: number;
    /**
     * 
     * @type {number}
     * @memberof Tx
     */
    timestamp?: number;
}
/**
 * Contains info about a 422 Validation Error response
 * @export
 * @interface ValidationError
 */
export interface ValidationError {
    /**
     * 
     * @type {string}
     * @memberof ValidationError
     */
    message: ValidationErrorMessageEnum;
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof ValidationError
     */
    details: { [key: string]: any; };
}

/**
    * @export
    * @enum {string}
    */
export enum ValidationErrorMessageEnum {
    ValidationFailed = 'Validation failed'
}


/**
 * V1Api - axios parameter creator
 * @export
 */
export const V1ApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Get the estimated gas cost of a transaction
         * @param {string} data input data
         * @param {string} from from address
         * @param {string} to to address
         * @param {string} value transaction value in wei
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        estimateGas: async (data: string, from: string, to: string, value: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'data' is not null or undefined
            assertParamExists('estimateGas', 'data', data)
            // verify required parameter 'from' is not null or undefined
            assertParamExists('estimateGas', 'from', from)
            // verify required parameter 'to' is not null or undefined
            assertParamExists('estimateGas', 'to', to)
            // verify required parameter 'value' is not null or undefined
            assertParamExists('estimateGas', 'value', value)
            const localVarPath = `/api/v1/gas/estimate`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (data !== undefined) {
                localVarQueryParameter['data'] = data;
            }

            if (from !== undefined) {
                localVarQueryParameter['from'] = from;
            }

            if (to !== undefined) {
                localVarQueryParameter['to'] = to;
            }

            if (value !== undefined) {
                localVarQueryParameter['value'] = value;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get account details by address
         * @param {string} pubkey account address
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccount: async (pubkey: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'pubkey' is not null or undefined
            assertParamExists('getAccount', 'pubkey', pubkey)
            const localVarPath = `/api/v1/account/{pubkey}`
                .replace(`{${"pubkey"}}`, encodeURIComponent(String(pubkey)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get the current recommended gas fees to use in a transaction  * For EIP-1559 transactions, use `maxFeePerGas` and `maxPriorityFeePerGas` * For Legacy transactions, use `gasPrice`
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getGasFees: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/v1/gas/fees`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get information about the running coinstack
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getInfo: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/v1/info`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get transaction history by address
         * @param {string} pubkey account address
         * @param {string} [cursor] the cursor returned in previous query (base64 encoded json object with a \&#39;page\&#39; property)
         * @param {number} [pageSize] page size (10 by default)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTxHistory: async (pubkey: string, cursor?: string, pageSize?: number, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'pubkey' is not null or undefined
            assertParamExists('getTxHistory', 'pubkey', pubkey)
            const localVarPath = `/api/v1/account/{pubkey}/txs`
                .replace(`{${"pubkey"}}`, encodeURIComponent(String(pubkey)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (cursor !== undefined) {
                localVarQueryParameter['cursor'] = cursor;
            }

            if (pageSize !== undefined) {
                localVarQueryParameter['pageSize'] = pageSize;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Sends raw transaction to be broadcast to the node.
         * @param {SendTxBody} sendTxBody serialized raw transaction hex
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        sendTx: async (sendTxBody: SendTxBody, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'sendTxBody' is not null or undefined
            assertParamExists('sendTx', 'sendTxBody', sendTxBody)
            const localVarPath = `/api/v1/send`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(sendTxBody, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * V1Api - functional programming interface
 * @export
 */
export const V1ApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = V1ApiAxiosParamCreator(configuration)
    return {
        /**
         * Get the estimated gas cost of a transaction
         * @param {string} data input data
         * @param {string} from from address
         * @param {string} to to address
         * @param {string} value transaction value in wei
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async estimateGas(data: string, from: string, to: string, value: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<string>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.estimateGas(data, from, to, value, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Get account details by address
         * @param {string} pubkey account address
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getAccount(pubkey: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<EthereumAccount>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getAccount(pubkey, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Get the current recommended gas fees to use in a transaction  * For EIP-1559 transactions, use `maxFeePerGas` and `maxPriorityFeePerGas` * For Legacy transactions, use `gasPrice`
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getGasFees(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<GasFees>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getGasFees(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Get information about the running coinstack
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getInfo(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Info>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getInfo(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Get transaction history by address
         * @param {string} pubkey account address
         * @param {string} [cursor] the cursor returned in previous query (base64 encoded json object with a \&#39;page\&#39; property)
         * @param {number} [pageSize] page size (10 by default)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getTxHistory(pubkey: string, cursor?: string, pageSize?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<EthereumTxHistory>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getTxHistory(pubkey, cursor, pageSize, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Sends raw transaction to be broadcast to the node.
         * @param {SendTxBody} sendTxBody serialized raw transaction hex
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async sendTx(sendTxBody: SendTxBody, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<string>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.sendTx(sendTxBody, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * V1Api - factory interface
 * @export
 */
export const V1ApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = V1ApiFp(configuration)
    return {
        /**
         * Get the estimated gas cost of a transaction
         * @param {string} data input data
         * @param {string} from from address
         * @param {string} to to address
         * @param {string} value transaction value in wei
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        estimateGas(data: string, from: string, to: string, value: string, options?: any): AxiosPromise<string> {
            return localVarFp.estimateGas(data, from, to, value, options).then((request) => request(axios, basePath));
        },
        /**
         * Get account details by address
         * @param {string} pubkey account address
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccount(pubkey: string, options?: any): AxiosPromise<EthereumAccount> {
            return localVarFp.getAccount(pubkey, options).then((request) => request(axios, basePath));
        },
        /**
         * Get the current recommended gas fees to use in a transaction  * For EIP-1559 transactions, use `maxFeePerGas` and `maxPriorityFeePerGas` * For Legacy transactions, use `gasPrice`
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getGasFees(options?: any): AxiosPromise<GasFees> {
            return localVarFp.getGasFees(options).then((request) => request(axios, basePath));
        },
        /**
         * Get information about the running coinstack
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getInfo(options?: any): AxiosPromise<Info> {
            return localVarFp.getInfo(options).then((request) => request(axios, basePath));
        },
        /**
         * Get transaction history by address
         * @param {string} pubkey account address
         * @param {string} [cursor] the cursor returned in previous query (base64 encoded json object with a \&#39;page\&#39; property)
         * @param {number} [pageSize] page size (10 by default)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTxHistory(pubkey: string, cursor?: string, pageSize?: number, options?: any): AxiosPromise<EthereumTxHistory> {
            return localVarFp.getTxHistory(pubkey, cursor, pageSize, options).then((request) => request(axios, basePath));
        },
        /**
         * Sends raw transaction to be broadcast to the node.
         * @param {SendTxBody} sendTxBody serialized raw transaction hex
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        sendTx(sendTxBody: SendTxBody, options?: any): AxiosPromise<string> {
            return localVarFp.sendTx(sendTxBody, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for estimateGas operation in V1Api.
 * @export
 * @interface V1ApiEstimateGasRequest
 */
export interface V1ApiEstimateGasRequest {
    /**
     * input data
     * @type {string}
     * @memberof V1ApiEstimateGas
     */
    readonly data: string

    /**
     * from address
     * @type {string}
     * @memberof V1ApiEstimateGas
     */
    readonly from: string

    /**
     * to address
     * @type {string}
     * @memberof V1ApiEstimateGas
     */
    readonly to: string

    /**
     * transaction value in wei
     * @type {string}
     * @memberof V1ApiEstimateGas
     */
    readonly value: string
}

/**
 * Request parameters for getAccount operation in V1Api.
 * @export
 * @interface V1ApiGetAccountRequest
 */
export interface V1ApiGetAccountRequest {
    /**
     * account address
     * @type {string}
     * @memberof V1ApiGetAccount
     */
    readonly pubkey: string
}

/**
 * Request parameters for getTxHistory operation in V1Api.
 * @export
 * @interface V1ApiGetTxHistoryRequest
 */
export interface V1ApiGetTxHistoryRequest {
    /**
     * account address
     * @type {string}
     * @memberof V1ApiGetTxHistory
     */
    readonly pubkey: string

    /**
     * the cursor returned in previous query (base64 encoded json object with a \&#39;page\&#39; property)
     * @type {string}
     * @memberof V1ApiGetTxHistory
     */
    readonly cursor?: string

    /**
     * page size (10 by default)
     * @type {number}
     * @memberof V1ApiGetTxHistory
     */
    readonly pageSize?: number
}

/**
 * Request parameters for sendTx operation in V1Api.
 * @export
 * @interface V1ApiSendTxRequest
 */
export interface V1ApiSendTxRequest {
    /**
     * serialized raw transaction hex
     * @type {SendTxBody}
     * @memberof V1ApiSendTx
     */
    readonly sendTxBody: SendTxBody
}

/**
 * V1Api - object-oriented interface
 * @export
 * @class V1Api
 * @extends {BaseAPI}
 */
export class V1Api extends BaseAPI {
    /**
     * Get the estimated gas cost of a transaction
     * @param {V1ApiEstimateGasRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1Api
     */
    public estimateGas(requestParameters: V1ApiEstimateGasRequest, options?: any) {
        return V1ApiFp(this.configuration).estimateGas(requestParameters.data, requestParameters.from, requestParameters.to, requestParameters.value, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get account details by address
     * @param {V1ApiGetAccountRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1Api
     */
    public getAccount(requestParameters: V1ApiGetAccountRequest, options?: any) {
        return V1ApiFp(this.configuration).getAccount(requestParameters.pubkey, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get the current recommended gas fees to use in a transaction  * For EIP-1559 transactions, use `maxFeePerGas` and `maxPriorityFeePerGas` * For Legacy transactions, use `gasPrice`
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1Api
     */
    public getGasFees(options?: any) {
        return V1ApiFp(this.configuration).getGasFees(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get information about the running coinstack
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1Api
     */
    public getInfo(options?: any) {
        return V1ApiFp(this.configuration).getInfo(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get transaction history by address
     * @param {V1ApiGetTxHistoryRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1Api
     */
    public getTxHistory(requestParameters: V1ApiGetTxHistoryRequest, options?: any) {
        return V1ApiFp(this.configuration).getTxHistory(requestParameters.pubkey, requestParameters.cursor, requestParameters.pageSize, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Sends raw transaction to be broadcast to the node.
     * @param {V1ApiSendTxRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1Api
     */
    public sendTx(requestParameters: V1ApiSendTxRequest, options?: any) {
        return V1ApiFp(this.configuration).sendTx(requestParameters.sendTxBody, options).then((request) => request(this.axios, this.basePath));
    }
}


