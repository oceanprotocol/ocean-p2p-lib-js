import { Stream } from 'stream'
import { OceanNodeKeys } from './p2p'
import { C2DClusterInfo } from './C2D'

export interface P2PStatusResponse {
  httpStatus: number
  error?: string
  headers?: any
}
export interface P2PCommandResponse {
  status: P2PStatusResponse
  stream: Stream | null
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

export interface OceanNodeP2PConfig {
  bootstrapNodes: string[]
  bootstrapTimeout: number
  bootstrapTagName: string
  bootstrapTagValue: number
  bootstrapTTL: number
  enableIPV4: boolean
  enableIPV6: boolean
  ipV4BindAddress: string | null
  ipV4BindTcpPort: number | null
  ipV4BindWsPort: number | null
  ipV6BindAddress: string | null
  ipV6BindTcpPort: number | null
  ipV6BindWsPort: number | null
  pubsubPeerDiscoveryInterval: number
  dhtMaxInboundStreams: number
  dhtMaxOutboundStreams: number
  enableDHTServer: boolean
  mDNSInterval: number
  connectionsMaxParallelDials: number
  connectionsDialTimeout: number
  announceAddresses: string[]
  filterAnnouncedAddresses: string[]
  autoNat: boolean
  upnp: boolean
  enableCircuitRelayServer: boolean
  enableCircuitRelayClient: boolean
  circuitRelays: number
  announcePrivateIp: boolean
  minConnections: number
  maxConnections: number
  autoDialPeerRetryThreshold: number
  autoDialConcurrency: number
  maxPeerAddrsToDial: number
  autoDialInterval: number
}
export interface DenyList {
  peers: string[]
  ips: string[]
}

export interface OceanNodeConfig {
  authorizedDecrypters: string[]
  allowedValidators: string[]
  keys: OceanNodeKeys
  hasP2P: boolean
  p2pConfig: OceanNodeP2PConfig | null
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
