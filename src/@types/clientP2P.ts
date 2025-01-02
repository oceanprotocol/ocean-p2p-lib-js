import { CommonOceanNodeConfig, OceanNodeKeys } from './commonP2P'

export interface OceanNodeP2PClientConfig extends CommonOceanNodeConfig {}

export interface OceanNodeProvider {
  chainId: string
  network: string
}
export interface StorageTypes {
  ipfs: boolean
  arwave: boolean
  url: boolean
}
export interface OceanNodeConfig {
  keys: OceanNodeKeys
  p2pConfig: OceanNodeP2PClientConfig | null
}

export interface NodeIpAndDns {
  ip: string
  port: number
  dns: string
  relay: boolean
  relayNode: string
}

export interface NodeCheckResult {
  peerId: string
  ipAddrs: NodeIpAndDns
  success: boolean
  errorCause: string
  status: string
  deltaTime: number
}
