import EventEmitter from 'node:events'
import { multiaddr } from '@multiformats/multiaddr'
import ip from 'ip'
// eslint-disable-next-line camelcase
import is_ip_private from 'private-ip'
import { Transform } from 'stream'

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
  _analyzeRemoteResponse: Transform
  _pendingAdvertise: string[] = []
  async hasPeer(peer: any) {
    const s = await this._libp2p.peerStore.all()
    return Boolean(s.find((p: any) => p.toString() === peer.toString()))
  }

  async getAllPeerStore() {
    const s = await this._libp2p.peerStore.all()
    return s
    // for await (const peer of this._libp2p.peerRouting.getClosestPeers(s[0].id.toString())) {
    //  console.log(peer.id, peer.multiaddrs)
    // }
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
