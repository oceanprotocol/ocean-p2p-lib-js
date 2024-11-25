import { C2DClusterInfo } from './C2D'
import { CommonOceanNodeConfig, DenyList, OceanNodeKeys } from './commonP2P'

export interface NetworkEvent {
  type: string
  text: string
}
export interface Hashes {
  [hash: string]: NetworkEvent
}
export interface OceanNodeDockerConfig {
  socketPath?: string
  protocol?: string
  host?: string
  port?: number
  caPath?: string
  certPath?: string
  keyPath?: string
}
export type FeeTokens = {
  chain: string // chain id => 137
  token: string // token => token address 0x967da4048cD07aB37855c090aAF366e4ce1b9F48
}

export type FeeAmount = {
  amount: number
  unit: string // ex: MB, KB, GB, etc...
}
// ocean node fees
export type FeeStrategy = {
  feeTokens: FeeTokens[]
  feeAmount: FeeAmount
}

export interface SupportedNetwork {
  chainId: number
  rpc: string
  network?: string
  chunkSize?: number
  startBlock?: number
  fallbackRPCs?: string[]
}

export interface RPCS {
  [chainId: string]: SupportedNetwork
}

export interface OceanNodeP2PServerConfig extends CommonOceanNodeConfig{
  bootstrapTimeout: number;
  bootstrapTagName: string;
  bootstrapTagValue: number;
  bootstrapTTL: number;
  enableDHTServer: boolean;
}

export interface OceanNodeConfig {
  authorizedDecrypters: string[]
  allowedValidators: string[]
  keys: OceanNodeKeys
  hasP2P: boolean
  p2pConfig: OceanNodeP2PServerConfig | null
  hasIndexer: boolean
  hasHttp: boolean
  hasDashboard: boolean
  httpPort: number
  feeStrategy: FeeStrategy
  supportedNetworks?: RPCS
  indexingNetworks?: RPCS
  c2dClusters: C2DClusterInfo[]
  c2dNodeUri: string
  dockerConfig?: OceanNodeDockerConfig
  accountPurgatoryUrl: string
  assetPurgatoryUrl: string
  allowedAdmins?: string[]
  codeHash?: string
  rateLimit?: number
  denyList?: DenyList
  unsafeURLs?: string[]
}
