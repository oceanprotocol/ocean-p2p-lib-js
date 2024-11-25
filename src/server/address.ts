import { ENVIRONMENT_VARIABLES } from '../utils/constants.js'
import { existsEnvironmentVariable } from './config.js'
import fs from 'fs'
import addresses from '@oceanprotocol/contracts/addresses/address.json' assert { type: 'json' }
import { CORE_LOGGER } from '../logging/common.js'
export function getOceanArtifactsAdresses(): any {
  try {
    if (existsEnvironmentVariable(ENVIRONMENT_VARIABLES.ADDRESS_FILE)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const data = fs.readFileSync(ENVIRONMENT_VARIABLES.ADDRESS_FILE.value, 'utf8')
      return JSON.parse(data)
    }
    return addresses
  } catch (error) {
    CORE_LOGGER.error(error)
    return addresses
  }
}
export const OCEAN_ARTIFACTS_ADDRESSES_PER_CHAIN = addresses
