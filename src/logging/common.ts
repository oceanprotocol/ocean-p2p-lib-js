import { CustomNodeLogger, getCustomLoggerForModule, LOGGER_MODULE_NAMES } from './Logger'

export const P2P_LOGGER: CustomNodeLogger = getCustomLoggerForModule(
  LOGGER_MODULE_NAMES.P2P
)
