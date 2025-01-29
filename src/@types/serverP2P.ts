/* eslint-disable no-unused-vars */
export enum dhtFilterMethod {
  filterPrivate = 'filterPrivate', // default, remove all private addresses from DHT
  filterPublic = 'filterPublic', // remove all public addresses from DHT
  filterNone = 'filterNone' // do not remove all any addresses from DHT
}
