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
                            itemId: {
                                type: 'string',
                                description: 'The item ID',
                            },
                            accountId: {
                                type: 'string',
                                description: 'The Plaid account ID',
                            },
                            name: {
                                type: 'string',
                                description: 'The account name',
                            },
                            mask: {
                                type: 'string',
                                description: 'The account mask',
                            },
                            officialName: {
                                type: 'string',
                                description: 'The account official name',
                            },
                            currentBalance: {
                                type: 'number',
                                description: 'The account current balance',
                            },
                            availableBalance: {
                                type: 'number',
                                description: 'The account available balance',
                            },
                            isoCurrencyCode: {
                                type: 'string',
                                description: 'The account ISO currency code',
                            },
                            unofficialCurrencyCode: {
                                type: 'string',
                                description:
                                    'The account unofficial currency code',
                            },
                            creditLimit: {
                                type: 'number',
                                description: 'The account credit limit',
                            },
                            type: {
                                type: 'string',
                                description: 'The account type',
                            },
                            subtype: {
                                type: 'string',
                                description: 'The account subtype',
                            },
                        },
                    },
                    Item: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: 'The item ID',
                            },
                            userId: {
                                type: 'string',
                                description: 'The user ID',
                            },
                            itemId: {
                                type: 'string',
                                description: 'The Plaid item ID',
                            },
                            accessToken: {
                                type: 'string',
                                description: 'The item access token',
                            },
                            institutionId: {
                                type: 'string',
                                description: 'The institution ID',
                            },
                            institutionName: {
                                type: 'string',
                                description: 'The institution name',
                            },
                            healthy: {
                                type: 'boolean',
                                description: 'The item healthy status',
                            },
                            cursor: {
                                type: 'string',
                                description: 'The item cursor',
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
                            linkToken: {
                                type: 'string',
                                description: 'The link token',
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
