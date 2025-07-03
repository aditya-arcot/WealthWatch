import { EnvNameEnum, ServerUrlEnum } from '@wealthwatch-shared'
import { Environment } from '../app/models/environment'

export const env: Environment = {
    name: EnvNameEnum.Prod,
    serverUrl: ServerUrlEnum.Prod,
}
