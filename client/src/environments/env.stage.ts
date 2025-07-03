import { EnvNameEnum, ServerUrlEnum } from '@wealthwatch-shared'
import { Environment } from '../app/models/environment'

export const env: Environment = {
    name: EnvNameEnum.Stage,
    serverUrl: ServerUrlEnum.Stage,
}
