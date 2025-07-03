import { EnvNameEnum } from '@wealthwatch-shared'
import { Environment } from '../app/models/environment'

export const env: Environment = {
    name: EnvNameEnum.Test,
    serverUrl: 'http://localhost:{SERVER_PORT}',
}
