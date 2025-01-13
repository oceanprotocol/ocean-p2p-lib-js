export interface CommonOceanNodeP2PConfig {
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
export interface OceanNodeKeys {
  peerId: any
  publicKey: any
  privateKey: any
  ethAddress: string
}
export interface OceanNodeP2PClientConfig extends CommonOceanNodeP2PConfig {}
export interface OceanNodeConfig {
  keys: OceanNodeKeys
  p2pConfig: OceanNodeP2PClientConfig | null
}
