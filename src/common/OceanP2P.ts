import EventEmitter from 'node:events'
import { multiaddr } from '@multiformats/multiaddr'
import ip from 'ip'
// eslint-disable-next-line camelcase
import is_ip_private from 'private-ip'
import { Transform } from 'stream'
import { OceanNodeConfig as ClientOceanNodeConfig } from '../@types/clientP2P'
import { OceanNodeConfig as ServerOceanNodeConfig } from '../@types/serverP2P'

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
  _config: ClientOceanNodeConfig | ServerOceanNodeConfig | null
  _analyzeRemoteResponse: Transform
  _pendingAdvertise: string[] = []
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
    // for await (const peer of this._libp2p.peerRouting.getClosestPeers(s[0].id.toString())) {
    //  console.log(peer.id, peer.multiaddrs)
    // }
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
        // disabled logs because of flooding
        // P2P_LOGGER.debug('Deny announcement of loopback ' + maddr.nodeAddress().address)
        return false
      }
      // check filters
      for (const filter of this._config.p2pConfig.filterAnnouncedAddresses) {
        if (ip.cidrSubnet(filter).contains(maddr.nodeAddress().address)) {
          // disabled logs because of flooding
          // P2P_LOGGER.debug(
          //  'Deny announcement of filtered ' +
          //    maddr.nodeAddress().address +
          //    '(belongs to ' +
          //    filter +
          //    ')'
          // )
          return false
        }
      }
      if (
        this._config.p2pConfig.announcePrivateIp === false &&
        (is_ip_private(maddr.nodeAddress().address) ||
          ip.isPrivate(maddr.nodeAddress().address))
      ) {
        // disabled logs because of flooding
        // P2P_LOGGER.debug(
        //  'Deny announcement of private address ' + maddr.nodeAddress().address
        // )
        return false
      } else {
        // disabled logs because of flooding
        // P2P_LOGGER.debug('Allow announcement of ' + maddr.nodeAddress().address)
        return true
      }
    } catch (e) {
      // we reach this part when having circuit relay. this is fine
      return true
    }
  }
}
