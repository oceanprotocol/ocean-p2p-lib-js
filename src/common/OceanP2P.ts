import EventEmitter from 'node:events'
import { multiaddr } from '@multiformats/multiaddr'
import ip from 'ip'
// eslint-disable-next-line camelcase
import is_ip_private from 'private-ip'
import { Transform } from 'stream'
import { OceanNodeConfig as ClientOceanNodeConfig } from '../@types/clientP2P'
import { Libp2p } from '@libp2p/interface'

export class OceanP2P extends EventEmitter {
  _libp2p: any
  _topic: string
  _options: any
  _peers: any[]
  _connections: {}
  _protocol: string
  _publicAddress: string
  _publicKey: Uint8Array
  _privateKey: Uint8Array
  _config: ClientOceanNodeConfig | null
  _analyzeRemoteResponse: Transform
  _pendingAdvertise: string[] = []

  async start(options: any = null) {}

  getPeerId(): string {
    return this._config.keys.peerId.toString()
  }

  /**
   * Is the message intended for this peer or we need to connect to another one?
   * @param targetPeerID  the target node id
   * @returns true if the message is intended for this peer, false otherwise
   */
  isTargetPeerSelf(targetPeerID: string): boolean {
    return targetPeerID === this.getPeerId()
  }

  // eslint-disable-next-line require-await
  async createNode(config: ClientOceanNodeConfig | null): Promise<Libp2p | null> {
    console.log('TOP 1')
    return null
  }

  async hasPeer(peer: any) {
    const s = await this._libp2p.peerStore.all()
    return Boolean(s.find((p: any) => p.toString() === peer.toString()))
  }

  // eslint-disable-next-line require-await
  async getOceanPeers(running: boolean = true, known: boolean = true) {
    console.log('Base implementation: getOceanPeers')
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
