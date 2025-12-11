import { AppRequest } from '@models'
import { queueLogAppRequest } from '@queues'
import { logger } from '@utilities'
import { randomInt } from 'crypto'
import { NextFunction, Request, Response } from 'express'

export const logRequestResponse = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const timestamp = new Date()
    const requestId = `${timestamp.getTime().toString()}-${String(randomInt(0, 100))}`
    const appReq: AppRequest = {
        id: -1,
        requestId,
        userId: req.session.user?.id ?? null,
        timestamp,
        duration: -1,
        method: req.method,
        url: req.baseUrl + req.path,
        queryParams: req.query,
        routeParams: req.params,
        requestHeaders: req.headers,
        requestBody: req.body as object | null,
        remoteAddress: req.socket.remoteAddress ?? null,
        remotePort: req.socket.remotePort ?? null,
        session: req.session,
        responseStatus: -1,
    }
    logger.info(`received request (id ${requestId}) - ${req.method} ${req.url}`)

    const send = res.send
    res.send = (body) => {
        // @ts-expect-error: custom property
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        res._body = body
        res.send = send
        return res.send(body)
    }

    res.on('finish', () => {
        appReq.duration = Date.now() - appReq.timestamp.getTime()
        appReq.responseStatus = res.statusCode
        appReq.responseHeaders = res.getHeaders()
        // @ts-expect-error: custom property
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        appReq.responseBody = res._body

        logger.info(`sending response (id ${requestId})`)
        queueLogAppRequest(appReq).catch((err: unknown) => {
            logger.error(err, 'failed to queue log app request')
        })
    })
    next()
}
