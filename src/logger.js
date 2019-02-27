import { Signale } from 'signale'
import figures from 'figures'

export const logger = new Signale({
  types: {
    info: {
      badge: figures.info,
      color: 'blue',
      label: 'info'
    },

    success: {
      badge: figures.tick,
      color: 'green',
      label: 'success'
    },

    warning: {
      badge: figures.warning,
      color: 'yellow',
      label: 'warning'
    }
  }
})

export default logger
