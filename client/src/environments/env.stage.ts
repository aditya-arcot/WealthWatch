import { Environment } from 'src/app/models/environment'
import { EnvNameEnum, ServerUrlEnum } from 'wealthwatch-shared'

export const env: Environment = {
    name: EnvNameEnum.Stage,
    serverUrl: ServerUrlEnum.Stage,
}
