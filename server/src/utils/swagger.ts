import { Request } from 'express'
import swaggerJSDoc from 'swagger-jsdoc'
import { SwaggerUiOptions } from 'swagger-ui-express'
import { HttpError } from '../models/error.js'
import { production, vars } from './env.js'

export const swaggerOptions: SwaggerUiOptions = {
    swaggerOptions: {
        requestInterceptor: async (req: Request) => {
            const url = req.url.split('/')[2]
            const serverUrl = `http://${url}`
            const response = await fetch(`${serverUrl}/csrf-token`)
            const data = (await response.json()) as { csrfToken: string }
            req.headers['x-csrf-token'] = data.csrfToken
            return req
        },
    },
}

export const createSwaggerSpec = () => {
    if (production) throw new HttpError('swagger should not be used in prod')
    const options = {
        definition: {
            openapi: '3.1.0',
            info: {
                title: `WealthWatch API - ${vars.nodeEnv}`,
                version: '1.0.0',
            },
            components: {
                schemas: {
                    Account: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The account id',
                            },
                            itemId: {
                                type: 'number',
                                description: 'The item id',
                            },
                            accountId: {
                                type: 'string',
                                description: 'The Plaid account id',
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
                    Category: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The category id',
                            },
                            name: {
                                type: 'string',
                                description: 'The category name',
                            },
                        },
                    },
                    Item: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The item id',
                            },
                            userId: {
                                type: 'number',
                                description: 'The user id',
                            },
                            itemId: {
                                type: 'string',
                                description: 'The Plaid item id',
                            },
                            active: {
                                type: 'boolean',
                                description: 'The item active status',
                            },
                            accessToken: {
                                type: 'string',
                                description: 'The item access token',
                            },
                            institutionId: {
                                type: 'string',
                                description: 'The item institution id',
                            },
                            institutionName: {
                                type: 'string',
                                description: 'The item institution name',
                            },
                            healthy: {
                                type: 'boolean',
                                description: 'The item healthy status',
                            },
                            cursor: {
                                type: 'string',
                                description: 'The item cursor',
                            },
                            lastSynced: {
                                type: 'date',
                                description: 'The item last synced date',
                            },
                            lastRefreshed: {
                                type: 'date',
                                description: 'The item last refreshed date',
                            },
                        },
                    },
                    Notification: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The notification id',
                            },
                            userId: {
                                type: 'number',
                                description: 'The user id',
                            },
                            typeId: {
                                type: 'number',
                                description: 'The notification type id',
                            },
                            message: {
                                type: 'string',
                                description: 'The notification message',
                            },
                            read: {
                                type: 'boolean',
                                description: 'The notification read status',
                            },
                            active: {
                                type: 'boolean',
                                description: 'The notification active status',
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
                    Transaction: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The transaction id',
                            },
                            accountId: {
                                type: 'number',
                                description: 'The account id',
                            },
                            transactionId: {
                                type: 'string',
                                description: 'The Plaid transaction id',
                            },
                            merchantId: {
                                type: 'string',
                                description: 'The transaction merchant id',
                            },
                            merchant: {
                                type: 'string',
                                description: 'The transaction merchant',
                            },
                            name: {
                                type: 'string',
                                description: 'The transaction name',
                            },
                            customName: {
                                type: 'string',
                                description: 'The transaction custom name',
                            },
                            amount: {
                                type: 'number',
                                description: 'The transaction amount',
                            },
                            primaryCategory: {
                                type: 'string',
                                description: 'The Plaid category',
                            },
                            detailedCategory: {
                                type: 'string',
                                description: 'The Plaid detailed category',
                            },
                            categoryId: {
                                type: 'number',
                                description: 'The transaction category id',
                            },
                            customCategoryId: {
                                type: 'number',
                                description:
                                    'The transaction custom category id',
                            },
                            paymentChannel: {
                                type: 'string',
                                description: 'The transaction payment channel',
                            },
                            isoCurrencyCode: {
                                type: 'string',
                                description:
                                    'The transaction ISO currency code',
                            },
                            unofficialCurrencyCode: {
                                type: 'string',
                                description:
                                    'The transaction unofficial currency code',
                            },
                            date: {
                                type: 'date',
                                description: 'The transaction date',
                            },
                            pending: {
                                type: 'boolean',
                                description: 'The transaction pending status',
                            },
                            note: {
                                type: 'string',
                                description: 'The transaction note',
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
                    User: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The user id',
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
