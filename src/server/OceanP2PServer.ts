import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { Libp2p, Libp2pOptions } from 'libp2p'
import { OceanP2P } from '../common/OceanP2P.js'
import { OceanNodeConfig } from '../@types/commonP2P.js'
import { autoNAT } from '@libp2p/autonat'
import { uPnPNAT } from '@libp2p/upnp-nat'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr, Multiaddr } from '@multiformats/multiaddr'
import { ServiceMap } from '@libp2p/interface'

export class OceanP2PServer extends OceanP2P {
  private _upnp_interval: NodeJS.Timeout
  async start() {
    await super.start()
  }

  getNodeOptions(config: OceanNodeConfig | null): Libp2pOptions<ServiceMap> {
    const options = super.getNodeOptions(config)
    if (config.p2pConfig.enableCircuitRelayServer) {
      options.services.circuitRelay = circuitRelayServer()
    }

    if (config.p2pConfig.upnp) {
      options.services.upnpNAT = uPnPNAT()
      this._upnp_interval = setInterval(this.UPnpCron.bind(this), 3000)
    }

    if (config.p2pConfig.autoNat) {
      options.services.autoNAT = autoNAT({
        maxInboundStreams: 20,
        maxOutboundStreams: 20
      })
    }
    return options
  }

  async createNode(config: OceanNodeConfig): Promise<Libp2p | null> {
    const node = await super.createNode(config)
    const upnpService = node.services.upnpNAT
    if (config.p2pConfig.upnp && upnpService) {
      this._upnp_interval = setInterval(this.UPnpCron.bind(this), 3000)
    }
    return node
  }

  async UPnpCron() {
    // we need to wait until we have some peers connected
    clearInterval(this._upnp_interval)
    const node = <any>this._libp2p
    if (node) {
      const connManager = node.components.connectionManager
      if (connManager) {
        const conns = await connManager.getConnections()
        if (conns.length > 1) {
          const upnpService = node.services.upnpNAT
          if (this._config.p2pConfig.upnp && upnpService) {
            try {
              await upnpService.mapIpAddresses()
            } catch (err) {
              console.error(err)
            }
            return
          }
        }
      }
    }
    this._upnp_interval = setInterval(this.UPnpCron.bind(this), 3000)
  }

  async getOceanPeers(running: boolean = true, known: boolean = true) {
    const peers: string[] = []
    if (known) {
      for (const peer of await this._libp2p.peerStore.all()) {
        if (!peers.includes(peer.id.toString())) peers.push(peer.id.toString())
      }
    }
    return peers
  }

  async getPeerDetails(peerName: string) {
    try {
      const peerId = peerIdFromString(peerName)
      // Example: for ID 16Uiu2HAkuYfgjXoGcSSLSpRPD6XtUgV71t5RqmTmcqdbmrWY9MJo
      // Buffer.from(this._config.keys.publicKey).toString('hex') =>         0201cabbabef1cc85218fa2d5bbadfb3425dfc091b311a33e6d9be26f6dcb94668
      // Buffer.from(peerId.publicKey).toString('hex')            => 080212210201cabbabef1cc85218fa2d5bbadfb3425dfc091b311a33e6d9be26f6dcb94668
      // 08021221 = > extra 4 bytes at the beginning, but they are important for later
      // UPDATE: no need to slice 4 bytes here, actually we need those on client side to verify the node id and perform the encryption of the keys + iv

      const pubKey = Buffer.from(peerId.publicKey).toString('hex') // no need to do .subarray(4).toString('hex')
      const peer = await this._libp2p.peerStore.get(peerId)

      // write the publicKey as well
      peer.publicKey = pubKey
      // Note: this is a 'compressed' version of the publicKey, we need to decompress it on client side (not working with bellow attempts)
      // otherwise the encryption will fail due to public key size mismatch

      // taken from '@libp2p/crypto/keys/secp256k1' decompressPublicKey (cannot import module/function)
      // const decompressedKey = secp.ProjectivePoint.fromHex(key.public.bytes).toRawBytes(false)
      // Buffer.from(decompressedKey).toString('hex')
      // in any case is not working (it crashes here)

      return peer
    } catch (e) {
      return null
    }
  }

  async getPeerMultiaddrs(
    peerName: string,
    searchPeerStore: boolean = true,
    searchDHT: boolean = true
  ): Promise<Multiaddr[]> {
    const multiaddrs: Multiaddr[] = []
    let peerId
    try {
      peerId = peerIdFromString(peerName)
    } catch (e) {
      return []
    }
    if (searchPeerStore) {
      // search peerStore
      try {
        const peerData = await this._libp2p.peerStore.get(peerId, {
          signal: AbortSignal.timeout(3000)
        })
        if (peerData) {
          for (const x of peerData.addresses) {
            multiaddrs.push(x.multiaddr)
          }
        }
      } catch (e) {
        // console.log(e)
      }
    }
    if (searchDHT) {
      try {
        const peerData = await this._libp2p.peerRouting.findPeer(peerId, {
          signal: AbortSignal.timeout(3000),
          useCache: false
        })
        if (peerData) {
          for (const index in peerData.multiaddrs) {
            multiaddrs.push(peerData.multiaddrs[index])
          }
        }
      } catch (e) {
        // console.log(e)
      }
    }
    let finalmultiaddrs: Multiaddr[] = []
    const finalmultiaddrsWithAddress: Multiaddr[] = []
    const finalmultiaddrsWithoutAddress: Multiaddr[] = []
    for (const x of multiaddrs) {
      if (x.toString().includes(peerName)) finalmultiaddrsWithAddress.push(x)
      else {
        let sd = x.toString()
        if (x.toString().includes('p2p-circuit')) {
          // because a p2p-circuit should always include peerId, if it's missing we will add it
          sd = sd + '/p2p/' + peerName
          finalmultiaddrsWithAddress.push(multiaddr(sd))
        } else {
          finalmultiaddrsWithoutAddress.push(multiaddr(sd))
        }
      }
    }
    if (finalmultiaddrsWithAddress.length > finalmultiaddrsWithoutAddress.length)
      finalmultiaddrs = finalmultiaddrsWithAddress
    else finalmultiaddrs = finalmultiaddrsWithoutAddress
    return finalmultiaddrs
  }

  async findPeerInDht(peerName: string, timeout?: number) {
    try {
      const peer = peerIdFromString(peerName)
      const data = await this._libp2p.peerRouting.findPeer(peer, {
        signal:
          isNaN(timeout) || timeout === 0
            ? AbortSignal.timeout(5000)
            : AbortSignal.timeout(timeout),
        useCache: true,
        useNetwork: true
      })
      return data
    } catch (e) {}
    return null
  }

  async closeStreamConnection(connection: any, remotePeer: string) {
    if (connection) {
      try {
        await connection.close()
      } catch (e) {
        console.error(`Error closing connection for peer ${remotePeer}: ${e.message}`)
      }
    }
  }
}
