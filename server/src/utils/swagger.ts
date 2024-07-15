import { Request } from 'express'
import { env } from 'process'
import swaggerJSDoc from 'swagger-jsdoc'
import { SwaggerUiOptions } from 'swagger-ui-express'
import { production } from './middleware.js'

export const swaggerOptions: SwaggerUiOptions = {
    swaggerOptions: {
        requestInterceptor: async (req: Request) => {
            const port = req.url.split('/')[2]?.split(':')[1]
            const serverUrl = `http://localhost:${port}`
            const response = await fetch(`${serverUrl}/csrf-token`)
            const data = (await response.json()) as { csrfToken: string }
            req.headers['x-csrf-token'] = data.csrfToken
            return req
        },
    },
}

export const createSwaggerSpec = () => {
    if (production) throw Error('swagger being used in prod')
    const options = {
        definition: {
            openapi: '3.1.0',
            info: {
                title: `WealthWatch API - ${env['NODE_ENV']}`,
                version: '1.0.0',
            },
            components: {
                schemas: {
                    Account: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: 'The account ID',
                            },
                            userId: {
                                type: 'string',
                                description: 'The user ID',
                            },
                            name: {
                                type: 'string',
                                description: 'The account name',
                            },
                        },
                    },
                    Secrets: {
                        type: 'object',
                        properties: {
                            logtailToken: {
                                type: 'string',
                                description: 'The Logtail token',
                            },
                        },
                    },
                    User: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: 'The user ID',
                            },
                            username: {
                                type: 'string',
                                description: 'The user username',
                            },
                            email: {
                                type: 'string',
                                description: 'The user email',
                            },
                            firstName: {
                                type: 'string',
                                description: 'The user first name',
                            },
                            lastName: {
                                type: 'string',
                                description: 'The user last name',
                            },
                            passwordHash: {
                                type: 'string',
                                description: 'The user password hash',
                            },
                        },
                    },
                    LinkToken: {
                        type: 'object',
                        properties: {
                            expiration: {
                                type: 'string',
                                description: 'The link token expiration',
                            },
                            linkToken: {
                                type: 'string',
                                description: 'The link token',
                            },
                            requestId: {
                                type: 'string',
                                description: 'The request ID',
                            },
                        },
                    },
                    AccessToken: {
                        type: 'object',
                        properties: {
                            accessToken: {
                                type: 'string',
                                description: 'The access token',
                            },
                            itemId: {
                                type: 'string',
                                description: 'The item ID',
                            },
                            requestId: {
                                type: 'string',
                                description: 'The request ID',
                            },
                        },
                    },
                },
                responses: {
                    Unauthorized: {
                        description: 'Unauthorized',
                    },
                },
            },
        },
        apis: ['./dist/routes/*.js'],
    }
    return swaggerJSDoc(options)
}
