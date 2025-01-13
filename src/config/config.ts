import { OceanNodeConfig } from '../@types/commonP2P'
import { defaultBootstrapAddresses } from '../utils/constants.js'
import { getPeerIdFromPrivateKey } from '../utils/utils.js'

export async function getDefaultClientConfig(
  privateKey: string
): Promise<OceanNodeConfig> {
  const config: OceanNodeConfig = {
    keys: await getPeerIdFromPrivateKey(privateKey),
    p2pConfig: {
      bootstrapNodes: defaultBootstrapAddresses,
      enableIPV4: true,
      enableIPV6: false,
      ipV4BindAddress: '0.0.0.0',
      ipV4BindTcpPort: 0,
      ipV4BindWsPort: 9001,
      ipV6BindAddress: '::1',
      ipV6BindTcpPort: 9002,
      ipV6BindWsPort: 9003,
      announceAddresses: [],
      pubsubPeerDiscoveryInterval: 3000,
      dhtMaxInboundStreams: 500,
      dhtMaxOutboundStreams: 500,
      mDNSInterval: 20e3,
      connectionsMaxParallelDials: 100 * 25,
      connectionsDialTimeout: 30e3,
      upnp: false,
      autoNat: false,
      enableCircuitRelayServer: false,
      enableCircuitRelayClient: false,
      circuitRelays: 0,
      announcePrivateIp: false,
      filterAnnouncedAddresses: ['172.15.0.0/24'],
      minConnections: 2,
      maxConnections: 6000,
      autoDialPeerRetryThreshold: 1000 * 120,
      autoDialConcurrency: 500,
      maxPeerAddrsToDial: 25,
      autoDialInterval: 5000
    }
  }
  return config
}
