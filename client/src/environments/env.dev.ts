import { Environment } from '@models/environment'
import { EnvNameEnum } from '@wealthwatch-shared'

export const env: Environment = {
    name: EnvNameEnum.Dev,
    serverUrl: 'http://localhost:3000',
}
