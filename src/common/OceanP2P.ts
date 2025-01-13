import EventEmitter from 'node:events'
import { multiaddr } from '@multiformats/multiaddr'
import ip from 'ip'
// eslint-disable-next-line camelcase
import is_ip_private from 'private-ip'
import { Libp2p } from '@libp2p/interface'
import { OceanNodeConfig } from '../@types/commonP2P'
import { Transform } from 'stream'

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

  async start(options: any = null) {}

  getPeerId(): string {
    return this._config.keys.peerId.toString()
  }

  isTargetPeerSelf(targetPeerID: string): boolean {
    return targetPeerID === this.getPeerId()
  }

  // eslint-disable-next-line require-await
  async createNode(config: OceanNodeConfig | null): Promise<Libp2p | null> {
    return null
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
