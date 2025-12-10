import { prod, stage } from '@utilities'
import { ClientUrlEnum } from '@wealthwatch-shared'
import _cors from 'cors'

export const cors = _cors({
    origin: prod ? (stage ? ClientUrlEnum.Stage : ClientUrlEnum.Prod) : true,
    credentials: true,
})
