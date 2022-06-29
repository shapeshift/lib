import axios, { AxiosRequestConfig } from 'axios'

const axiosConfig: AxiosRequestConfig = {
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}

export const zrxServiceFactory = (baseUrl: string) =>
  axios.create({ ...axiosConfig, baseURL: baseUrl })
