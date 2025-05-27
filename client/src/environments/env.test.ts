import { Environment } from 'src/app/models/environment'
import { EnvNameEnum } from 'wealthwatch-shared'

export const env: Environment = {
    name: EnvNameEnum.Test,
    serverUrl: 'http://localhost:{SERVER_PORT}',
}
