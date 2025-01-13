import EventEmitter from 'node:events'
import { bootstrap } from '@libp2p/bootstrap'
import { noise } from '@chainsafe/libp2p-noise'
import { mdns } from '@libp2p/mdns'
import { yamux } from '@chainsafe/libp2p-yamux'
import { Transform } from 'stream'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { createLibp2p, Libp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { ping } from '@libp2p/ping'
import { dcutr } from '@libp2p/dcutr'
import { kadDHT, passthroughMapper } from '@libp2p/kad-dht'
import { Ed25519PeerId, RSAPeerId, Secp256k1PeerId, URLPeerId } from '@libp2p/interface'
import { OceanP2P } from '../common/OceanP2P.js'
import { OceanNodeConfig } from '../@types/commonP2P.js'

EventEmitter.defaultMaxListeners = 500

export class OceanP2PClient extends OceanP2P {
  async start(options: any = null) {
    this._topic = 'oceanprotocol'
    this._libp2p = await this.createNode(this._config)

    this._analyzeRemoteResponse = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase())
      }
    })
  }

  async createNode(config: OceanNodeConfig): Promise<Libp2p | null> {
    try {
      this._publicAddress = config.keys.peerId.toString()
      this._publicKey = config.keys.publicKey
      this._privateKey = config.keys.privateKey
      /** @type {import('libp2p').Libp2pOptions} */
      const servicesConfig = {
        identify: identify(),
        dht: kadDHT({
          // this is necessary because this node is not connected to the public network
          // it can be removed if, for example bootstrappers are configured
          allowQueryWithZeroPeers: true,
          maxInboundStreams: config.p2pConfig.dhtMaxInboundStreams,
          maxOutboundStreams: config.p2pConfig.dhtMaxOutboundStreams,
          pingTimeout: 1300,
          pingConcurrency: 20,
          clientMode: false, // this should be true for edge devices
          kBucketSize: 20,
          protocol: '/ocean/nodes/1.0.0/kad/1.0.0',
          peerInfoMapper: passthroughMapper
        }),
        ping: ping(),
        dcutr: dcutr()
      }
      const bindInterfaces = []
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
      const transports = [
        webSockets(),
        tcp(),
        circuitRelayTransport({
          discoverRelays: 0
        })
      ]

      let addresses = {}
      if (
        config.p2pConfig.announceAddresses &&
        config.p2pConfig.announceAddresses.length > 0
      ) {
        addresses = {
          listen: bindInterfaces,
          announceFilter: (multiaddrs: any[]) =>
            multiaddrs.filter((m) => this.shouldAnnounce(m)),
          announce: config.p2pConfig.announceAddresses
        }
      } else {
        addresses = {
          listen: bindInterfaces,
          announceFilter: (multiaddrs: any[]) =>
            multiaddrs.filter((m) => this.shouldAnnounce(m))
        }
      }
      let options = {
        addresses,
        peerId: config.keys.peerId,
        transports,
        streamMuxers: [yamux()],
        connectionEncryption: [noise()],
        services: servicesConfig,
        connectionManager: {
          maxParallelDials: config.p2pConfig.connectionsMaxParallelDials, // 150 total parallel multiaddr dials
          dialTimeout: config.p2pConfig.connectionsDialTimeout, // 10 second dial timeout per peer dial
          minConnections: config.p2pConfig.minConnections,
          maxConnections: config.p2pConfig.maxConnections,
          autoDialPeerRetryThreshold: config.p2pConfig.autoDialPeerRetryThreshold,
          autoDialConcurrency: config.p2pConfig.autoDialConcurrency,
          maxPeerAddrsToDial: config.p2pConfig.maxPeerAddrsToDial,
          autoDialInterval: config.p2pConfig.autoDialInterval
        }
      }
      if (config.p2pConfig.bootstrapNodes && config.p2pConfig.bootstrapNodes.length > 0) {
        options = {
          ...options,
          ...{
            peerDiscovery: [
              bootstrap({
                list: config.p2pConfig.bootstrapNodes,
                timeout: 20000, // in ms,
                tagName: 'bootstrap',
                tagValue: 50,
                tagTTL: 120000
              }),
              mdns({
                interval: config.p2pConfig.mDNSInterval
              })
            ]
          }
        }
      } else {
        // only mdns & pubsubPeerDiscovery
        options = {
          ...options,
          ...{
            peerDiscovery: [
              mdns({
                interval: config.p2pConfig.mDNSInterval
              })
            ]
          }
        }
      }
      const node = await createLibp2p(options)
      await node.start()
      return node
    } catch (e) {
      console.error(`Error in creating node: ${e.message}`)
    }
    return null
  }

  async getOceanPeers(
    running: boolean = true,
    known: boolean = true
  ): Promise<{ [peerId: string]: string[] }> {
    const allPeers: { [peerId: string]: string[] } = {}

    try {
      if (known) {
        const peers = await this._libp2p.peerStore.all()

        for (const peer of peers) {
          const peerId = peer.id.toString()

          if (!allPeers[peerId]) {
            allPeers[peerId] = []
          }

          for (const addr of peer.addresses) {
            allPeers[peerId].push(addr.multiaddr.toString())
          }
        }
      }
    } catch (error) {
      console.error('Error getting peers from peerStore:', error)
    }

    console.log('Got ' + Object.keys(allPeers).length + ' peers from peerStore')
    return allPeers
  }

  getPeerConnectionWithTimeout(
    peerId: Ed25519PeerId | Secp256k1PeerId | RSAPeerId | URLPeerId,
    timeout: number
  ) {
    return Promise.race([
      this._libp2p.getConnections(peerId)?.[0],
      // eslint-disable-next-line promise/param-names
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Timeout while retrieving peer connection')),
          timeout
        )
      )
    ])
  }

  closePeerConnection(peerConnection: any) {
    try {
      peerConnection.abort()
    } catch (e) {
      console.log('Error whtile closing peer connection: ', e.message)
    }
  }
}
