import { Stream } from 'stream'

export interface DenyList {
  peers: string[]
  ips: string[]
}

export interface OceanNodeKeys {
  peerId: any
  publicKey: any
  privateKey: any
  ethAddress: string
}
export interface P2PStatusResponse {
  httpStatus: number
  error?: string
  headers?: any
}
export interface P2PCommandResponse {
  status: P2PStatusResponse
  stream: Stream | null
}
