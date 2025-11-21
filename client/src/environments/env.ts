import { Environment } from '@models/environment'
import { EnvNameEnum, ServerUrlEnum } from '@wealthwatch-shared'

export const env: Environment = {
    name: EnvNameEnum.Prod,
    serverUrl: ServerUrlEnum.Prod,
}
