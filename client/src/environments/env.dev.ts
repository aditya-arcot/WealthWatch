import { EnvNameEnum } from '@wealthwatch-shared'
import { Environment } from '../app/models/environment'

export const env: Environment = {
    name: EnvNameEnum.Dev,
    serverUrl: 'http://localhost:3000',
}
