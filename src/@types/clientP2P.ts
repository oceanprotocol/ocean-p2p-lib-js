import { OceanNodeKeys } from './commonP2P'

export interface OceanNodeP2PConfig {
  bootstrapNodes: string[]
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

export interface OceanNodeProvider {
  chainId: string
  network: string
}

export interface OceanNodeIndexer {
  chainId: string
  network: string
  block?: string // mark it as optional until the functionality is done
}
export interface StorageTypes {
  ipfs: boolean
  arwave: boolean
  url: boolean
}

export interface OceanNodeStatus {
  id: string
  publicKey: string
  address: string
  version: string
  http: boolean
  p2p: boolean
  provider: OceanNodeProvider[]
  indexer: OceanNodeIndexer[]
  supportedStorage: StorageTypes
  platform: any
  uptime?: number // seconds since start
  codeHash?: string
  allowedAdmins?: string[]
  // detailed information
  c2dClusters?: any
  supportedSchemas?: any
}

export interface OceanNodeConfig {
  keys: OceanNodeKeys
  p2pConfig: OceanNodeP2PConfig | null
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
