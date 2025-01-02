// eslint-disable-next-line camelcase
import is_ip_private from 'private-ip'
import ip from 'ip'
import { type Multiaddr, multiaddr } from '@multiformats/multiaddr'
import dns from 'dns'
import { keys } from '@libp2p/crypto'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { Wallet } from 'ethers'
import crypto from 'crypto'
import { OceanNodeKeys } from '../@types/commonP2P.js'
import { NodeIpAndDns } from '../@types/clientP2P.js'

export function hexStringToByteArray(hexString: any) {
  if (hexString.length % 2 !== 0) {
    throw new Error('Must have an even number of hex digits to convert to bytes')
  } /* w w w.  jav  a2 s .  c o  m */
  const numBytes = hexString.length / 2
  const byteArray = new Uint8Array(numBytes)
  for (let i = 0; i < numBytes; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16)
  }
  return byteArray
}

export function create256Hash(input: string): string {
  const result = crypto.createHash('sha256').update(input).digest('hex')
  return '0x' + result
}
export async function getPeerIdFromPrivateKey(
  privateKey: string
): Promise<OceanNodeKeys> {
  const key = new keys.supportedKeys.secp256k1.Secp256k1PrivateKey(
    hexStringToByteArray(privateKey.slice(2))
  )

  return {
    peerId: await createFromPrivKey(key),
    publicKey: key.public.bytes,
    // Notes:
    // using 'key.public.bytes' gives extra 4 bytes: 08021221
    // using (key as any)._publicKey is stripping this same 4 bytes at the beginning: 08021221
    // when getting the peer details with 'peerIdFromString(peerName)' it returns the version with the 4 extra bytes
    // and we also need to send that to the client, so he can uncompress the public key correctly and perform the check and the encryption
    // so it would make more sense to use this value on the configuration
    privateKey: (key as any)._key,
    ethAddress: new Wallet(privateKey.substring(2)).address
  }
}
function lookupPromise(addr: string) {
  return new Promise((resolve, reject) => {
    dns.lookup(addr, (err, address) => {
      if (err) reject(err)
      resolve(address)
    })
  })
}
export async function extractPublicIp(addrs: Multiaddr[]): Promise<NodeIpAndDns> {
  const ipFound: NodeIpAndDns = {
    ip: null,
    dns: null,
    port: 0,
    relay: false,
    relayNode: null
  }
  // first, let's search for dns entries, exclude anything else

  for (const addr of addrs) {
    try {
      const maddr = multiaddr(addr)
      const protos = maddr.protos()
      if (protos.some((e) => e.name === 'p2p-circuit')) {
        // it's a relay, don't count it
        continue
      }

      for (const index in protos) {
        const proto = protos[index]
        if (proto.name === 'dns4' || proto.name === 'dns6') {
          // we have a dns, let's resolve it
          try {
            // console.log("Resolving "+maddr.nodeAddress().address)
            const resolved = await lookupPromise(maddr.nodeAddress().address as string)
            // console.log('Resolved:')
            // console.log(resolved)
            if (
              ip.isLoopback(resolved as string) ||
              is_ip_private(resolved as string) ||
              ip.isPrivate(resolved as string)
            ) {
              // console.log((resolved as string) + ' is loopback/private. carry on')
              continue
            } else {
              // console.log(
              //  'Returning ip ' + resolved + ' and dns ' + maddr.nodeAddress().address
              // )
              return {
                ip: resolved as string,
                dns: maddr.nodeAddress().address,
                port: maddr.nodeAddress().port,
                relay: false,
                relayNode: null
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
  // we have no dns, so let's get the first public ip
  for (const addr of addrs) {
    // console.log('Trying ' + addr.multiaddr)
    try {
      const maddr = multiaddr(addr)
      const protos = maddr.protos()
      if (protos.some((e) => e.name === 'p2p-circuit')) {
        // it's a relay, don't count it
        continue
      }
      for (const index in protos) {
        const proto = protos[index]
        // console.log('proto obj')
        // console.log(proto)
        if (proto.name === 'ip4' || proto.name === 'ip66') {
          // we have an ip, let's check it for private classes
          if (
            ip.isLoopback(maddr.nodeAddress().address) ||
            is_ip_private(maddr.nodeAddress().address) ||
            ip.isPrivate(maddr.nodeAddress().address)
          ) {
            // console.log(maddr.nodeAddress().address + ' is loopback/private. carry on')
            continue
          } else {
            // console.log('Returning only ip ' + maddr.nodeAddress().address)
            return {
              ip: maddr.nodeAddress().address,
              dns: null,
              port: maddr.nodeAddress().port,
              relay: false,
              relayNode: null
            }
          }
        }
      }
    } catch (e) {
      // we reach this part when having circuit relay. this is fine
      console.error(e)
    }
  }

  // we have no dns,no ip , maybe circuit relays
  for (const addr of addrs) {
    // console.log('Trying ' + addr)
    try {
      const maddr = multiaddr(addr)
      const protos = maddr.protos()
      if (protos.some((e) => e.name === 'p2p-circuit')) {
        for (const index in protos) {
          const proto = protos[index]
          if (proto.name === 'p2p-circuit' || proto.name === 'p2p-circuit') {
            return {
              ip: null,
              dns: null,
              port: maddr.nodeAddress().port,
              relay: true,
              relayNode: maddr.nodeAddress().address
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
  return ipFound
}
