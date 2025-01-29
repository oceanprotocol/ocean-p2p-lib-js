import EventEmitter from 'node:events'
import { multiaddr } from '@multiformats/multiaddr'
import ip from 'ip'
import { bootstrap } from '@libp2p/bootstrap'
import { noise } from '@chainsafe/libp2p-noise'
import { mdns } from '@libp2p/mdns'
import { yamux } from '@chainsafe/libp2p-yamux'
// eslint-disable-next-line camelcase
import is_ip_private from 'private-ip'
import { createLibp2p, Libp2p, Libp2pOptions } from 'libp2p'
import { OceanNodeConfig } from '../@types/commonP2P'
import { Transform } from 'stream'
import { ServiceMap } from '@libp2p/interface'
import { identify } from '@libp2p/identify'
import { kadDHT, passthroughMapper } from '@libp2p/kad-dht'
import { ping } from '@libp2p/ping'
import { dcutr } from '@libp2p/dcutr'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
export class OceanP2P extends EventEmitter {
  _libp2p: any
  _topic: string = 'oceanprotocol'
  _protocol: string = '/ocean/nodes/1.0.0'
  _publicAddress: string
  _publicKey: Uint8Array
  _privateKey: Uint8Array
  _config: OceanNodeConfig
  _analyzeRemoteResponse: Transform
  constructor(config: OceanNodeConfig) {
    super()
    this._config = config
  }

  async start() {
    this._topic = 'oceanprotocol'
    this._libp2p = await this.createNode(this._config)

    this._analyzeRemoteResponse = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase())
      }
    })
  }

  getPeerId(): string {
    return this._config.keys.peerId.toString()
  }

  isTargetPeerSelf(targetPeerID: string): boolean {
    return targetPeerID === this.getPeerId()
  }

  private getBindInterfaces(config: OceanNodeConfig): string[] {
    const bindInterfaces: string[] = []

    if (config.p2pConfig.enableIPV4) {
      bindInterfaces.push(
        `/ip4/${config.p2pConfig.ipV4BindAddress}/tcp/${config.p2pConfig.ipV4BindTcpPort}`
      )
      bindInterfaces.push(
        `/ip4/${config.p2pConfig.ipV4BindAddress}/tcp/${config.p2pConfig.ipV4BindWsPort}/ws`
      )
    }

    if (config.p2pConfig.enableIPV6) {
      bindInterfaces.push(
        `/ip6/${config.p2pConfig.ipV6BindAddress}/tcp/${config.p2pConfig.ipV6BindTcpPort}`
      )
      bindInterfaces.push(
        `/ip6/${config.p2pConfig.ipV6BindAddress}/tcp/${config.p2pConfig.ipV6BindWsPort}/ws`
      )
    }

    return bindInterfaces
  }

  getNodeOptions(config: OceanNodeConfig | null): Libp2pOptions<ServiceMap> {
    const addresses = {
      listen: this.getBindInterfaces(config),
      announceFilter: (multiaddrs: any[]) =>
        multiaddrs.filter((m) => this.shouldAnnounce(m)),
      announce: config.p2pConfig.announceAddresses || []
    }

    const servicesConfig = {
      identify: identify(),
      dht: kadDHT({
        allowQueryWithZeroPeers: false,
        maxInboundStreams: config.p2pConfig.dhtMaxInboundStreams,
        maxOutboundStreams: config.p2pConfig.dhtMaxOutboundStreams,
        clientMode: false,
        kBucketSize: 20,
        protocol: '/ocean/nodes/1.0.0/kad/1.0.0',
        peerInfoMapper: passthroughMapper
      }),
      ping: ping(),
      dcutr: dcutr()
    }

    const transports = [
      webSockets(),
      tcp(),
      circuitRelayTransport({
        discoverRelays: config.p2pConfig.circuitRelays || 0
      })
    ]
    const options = {
      addresses,
      peerId: config.keys.peerId,
      transports,
      streamMuxers: [yamux()],
      connectionEncryption: [noise()],
      services: servicesConfig,
      connectionManager: {
        maxParallelDials: config.p2pConfig.connectionsMaxParallelDials,
        dialTimeout: config.p2pConfig.connectionsDialTimeout,
        minConnections: config.p2pConfig.minConnections,
        maxConnections: config.p2pConfig.maxConnections,
        autoDialPeerRetryThreshold: config.p2pConfig.autoDialPeerRetryThreshold,
        autoDialConcurrency: config.p2pConfig.autoDialConcurrency,
        maxPeerAddrsToDial: config.p2pConfig.maxPeerAddrsToDial,
        autoDialInterval: config.p2pConfig.autoDialInterval
      },
      peerDiscovery: [
        bootstrap({
          list: config.p2pConfig.bootstrapNodes || [],
          timeout: config.p2pConfig.bootstrapTimeout || 20000,
          tagName: config.p2pConfig.bootstrapTagName || 'bootstrap',
          tagValue: config.p2pConfig.bootstrapTagValue || 50,
          tagTTL: config.p2pConfig.bootstrapTTL || 120000
        }),
        mdns({
          interval: config.p2pConfig.mDNSInterval
        })
      ]
    }
    return options
  }

  async createNode(config: OceanNodeConfig | null): Promise<Libp2p | null> {
    this._publicAddress = config.keys.peerId.toString()
    this._publicKey = config.keys.publicKey
    this._privateKey = config.keys.privateKey
    const node = await createLibp2p(this.getNodeOptions(config))
    await node.start()
    return node
  }

  async hasPeer(peer: any) {
    const s = await this._libp2p.peerStore.all()
    return Boolean(s.find((p: any) => p.toString() === peer.toString()))
  }

  // eslint-disable-next-line require-await
  async getOceanPeers(running: boolean = true, known: boolean = true) {
    return null as any
  }

  async getRunningOceanPeers() {
    return await this.getOceanPeers(true, false)
  }

  async getKnownOceanPeers() {
    return await this.getOceanPeers(false, true)
  }

  async getAllOceanPeers() {
    return await this.getOceanPeers(true, true)
  }

  async getAllPeerStore() {
    const s = await this._libp2p.peerStore.all()
    return s
  }

  async getNetworkingStats() {
    const ret: any = {}
    ret.binds = await this._libp2p.components.addressManager.getListenAddrs()
    ret.listen = await this._libp2p.components.transportManager.getAddrs()
    ret.observing = await this._libp2p.components.addressManager.getObservedAddrs()
    ret.announce = await this._libp2p.components.addressManager.getAnnounceAddrs()
    ret.connections = await this._libp2p.getConnections()
    return ret
  }

  shouldAnnounce(addr: any) {
    try {
      const maddr = multiaddr(addr)
      // always filter loopback
      if (ip.isLoopback(maddr.nodeAddress().address)) {
        return false
      }
      // check filters
      for (const filter of this._config.p2pConfig.filterAnnouncedAddresses) {
        if (ip.cidrSubnet(filter).contains(maddr.nodeAddress().address)) {
          return false
        }
      }
      if (
        this._config.p2pConfig.announcePrivateIp === false &&
        (is_ip_private(maddr.nodeAddress().address) ||
          ip.isPrivate(maddr.nodeAddress().address))
      ) {
        return false
      } else {
        return true
      }
    } catch (e) {
      // we reach this part when having circuit relay. this is fine
      return true
    }
  }
}
