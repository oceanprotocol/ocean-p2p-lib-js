import EventEmitter from 'node:events'
import { Ed25519PeerId, RSAPeerId, Secp256k1PeerId, URLPeerId } from '@libp2p/interface'
import { OceanP2P } from '../common/OceanP2P.js'

EventEmitter.defaultMaxListeners = 500

export class OceanP2PClient extends OceanP2P {
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
