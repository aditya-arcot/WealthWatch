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
            openapi: '3.0.3',
            info: {
                title: `WealthWatch API - ${vars.nodeEnv}`,
                version: '1.0.0',
            },
            components: {
                schemas: {
                    AccessRequest: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            email: {
                                type: 'string',
                            },
                            firstName: {
                                type: 'string',
                            },
                            lastName: {
                                type: 'string',
                            },
                            statusId: {
                                type: 'number',
                            },
                            accessCode: {
                                type: 'string',
                            },
                            reviewer: {
                                type: 'string',
                            },
                        },
                    },
                    Account: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            itemId: {
                                type: 'number',
                            },
                            accountId: {
                                type: 'string',
                            },
                            name: {
                                type: 'string',
                            },
                            mask: {
                                type: 'string',
                            },
                            officialName: {
                                type: 'string',
                            },
                            currentBalance: {
                                type: 'number',
                            },
                            availableBalance: {
                                type: 'number',
                            },
                            isoCurrencyCode: {
                                type: 'string',
                            },
                            unofficialCurrencyCode: {
                                type: 'string',
                            },
                            creditLimit: {
                                type: 'number',
                            },
                            type: {
                                type: 'string',
                            },
                            subtype: {
                                type: 'string',
                            },
                        },
                    },
                    Category: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            name: {
                                type: 'string',
                            },
                        },
                    },
                    CategorySummary: {
                        type: 'object',
                        properties: {
                            categoryId: {
                                type: 'number',
                            },
                            total: {
                                type: 'number',
                            },
                            count: {
                                type: 'number',
                            },
                        },
                    },
                    CategoryTotalByDate: {
                        type: 'object',
                        properties: {
                            categoryId: {
                                type: 'number',
                            },
                            totalByDate: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        date: {
                                            type: 'string',
                                        },
                                        total: {
                                            type: 'number',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    CreditCardLiability: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            accountId: {
                                type: 'number',
                            },
                            aprs: {
                                type: 'object',
                            },
                            overdue: {
                                type: 'boolean',
                            },
                            lastPaymentDate: {
                                type: 'date',
                            },
                            lastPaymentAmount: {
                                type: 'number',
                            },
                            lastStatementDate: {
                                type: 'date',
                            },
                            lastStatementBalance: {
                                type: 'number',
                            },
                            nextPaymentDueDate: {
                                type: 'date',
                            },
                            minimumPaymentAmount: {
                                type: 'number',
                            },
                        },
                    },
                    HoldingWithSecurity: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            accountId: {
                                type: 'number',
                            },
                            name: {
                                type: 'string',
                            },
                            typeId: {
                                type: 'number',
                            },
                            cashEquivalent: {
                                type: 'boolean',
                            },
                            ticker: {
                                type: 'string',
                            },
                            marketCode: {
                                type: 'string',
                            },
                            price: {
                                type: 'number',
                            },
                            priceAsOf: {
                                type: 'date',
                            },
                            closePrice: {
                                type: 'number',
                            },
                            closePriceAsOf: {
                                type: 'date',
                            },
                            quantity: {
                                type: 'number',
                            },
                            value: {
                                type: 'number',
                            },
                            costBasis: {
                                type: 'number',
                            },
                            isoCurrencyCode: {
                                type: 'string',
                            },
                            unofficialCurrencyCode: {
                                type: 'string',
                            },
                        },
                    },
                    Item: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            userId: {
                                type: 'number',
                            },
                            itemId: {
                                type: 'string',
                            },
                            active: {
                                type: 'boolean',
                            },
                            accessToken: {
                                type: 'string',
                            },
                            institutionId: {
                                type: 'string',
                            },
                            institutionName: {
                                type: 'string',
                            },
                            healthy: {
                                type: 'boolean',
                            },
                            cursor: {
                                type: 'string',
                            },
                            lastRefreshed: {
                                type: 'date',
                            },
                            transactionsLastRefreshed: {
                                type: 'date',
                            },
                        },
                    },
                    Mortgage: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            accountId: {
                                type: 'number',
                            },
                            type: {
                                type: 'string',
                            },
                            interestRateType: {
                                type: 'string',
                            },
                            interestRatePercent: {
                                type: 'number',
                            },
                            term: {
                                type: 'string',
                            },
                            address: {
                                type: 'string',
                            },
                            originationDate: {
                                type: 'date',
                            },
                            originationPrincipal: {
                                type: 'number',
                            },
                            maturityDate: {
                                type: 'date',
                            },
                            lateFee: {
                                type: 'number',
                            },
                            escrowBalance: {
                                type: 'number',
                            },
                            prepaymentPenalty: {
                                type: 'boolean',
                            },
                            privateInsurance: {
                                type: 'boolean',
                            },
                            pastDueAmount: {
                                type: 'number',
                            },
                            lastPaymentDate: {
                                type: 'date',
                            },
                            lastPaymentAmount: {
                                type: 'number',
                            },
                            nextPaymentDueDate: {
                                type: 'date',
                            },
                            nextPaymentAmount: {
                                type: 'number',
                            },
                            ytdInterestPaid: {
                                type: 'number',
                            },
                            ytdPrincipalPaid: {
                                type: 'number',
                            },
                        },
                    },
                    Notification: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            userId: {
                                type: 'number',
                            },
                            typeId: {
                                type: 'number',
                            },
                            message: {
                                type: 'string',
                            },
                            read: {
                                type: 'boolean',
                            },
                            active: {
                                type: 'boolean',
                            },
                        },
                    },
                    Secrets: {
                        type: 'object',
                        properties: {
                            logtailToken: {
                                type: 'string',
                            },
                        },
                    },
                    StudentLoanLiability: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            accountId: {
                                type: 'number',
                            },
                            name: {
                                type: 'string',
                            },
                            interestRatePercent: {
                                type: 'number',
                            },
                            statusTypeId: {
                                type: 'number',
                            },
                            statusEndDate: {
                                type: 'date',
                            },
                            overdue: {
                                type: 'boolean',
                            },
                            originationDate: {
                                type: 'date',
                            },
                            originationPrincipal: {
                                type: 'number',
                            },
                            disbursementDates: {
                                type: 'string',
                            },
                            outstandingInterest: {
                                type: 'number',
                            },
                            expectedPayoffDate: {
                                type: 'date',
                            },
                            guarantor: {
                                type: 'string',
                            },
                            servicerAddress: {
                                type: 'string',
                            },
                            repaymentPlanTypeId: {
                                type: 'number',
                            },
                            repaymentPlanDescription: {
                                type: 'string',
                            },
                            lastPaymentDate: {
                                type: 'date',
                            },
                            lastPaymentAmount: {
                                type: 'number',
                            },
                            lastStatementDate: {
                                type: 'date',
                            },
                            lastStatementBalance: {
                                type: 'number',
                            },
                            nextPaymentDueDate: {
                                type: 'date',
                            },
                            minimumPaymentAmount: {
                                type: 'number',
                            },
                            ytdInterestPaid: {
                                type: 'number',
                            },
                            ytdPrincipalPaid: {
                                type: 'number',
                            },
                        },
                    },
                    Transaction: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            accountId: {
                                type: 'number',
                            },
                            transactionId: {
                                type: 'string',
                            },
                            merchantId: {
                                type: 'string',
                            },
                            merchant: {
                                type: 'string',
                            },
                            name: {
                                type: 'string',
                            },
                            customName: {
                                type: 'string',
                            },
                            amount: {
                                type: 'number',
                            },
                            primaryCategory: {
                                type: 'string',
                            },
                            detailedCategory: {
                                type: 'string',
                            },
                            categoryId: {
                                type: 'number',
                            },
                            customCategoryId: {
                                type: 'number',
                            },
                            paymentChannel: {
                                type: 'string',
                            },
                            isoCurrencyCode: {
                                type: 'string',
                            },
                            unofficialCurrencyCode: {
                                type: 'string',
                            },
                            date: {
                                type: 'date',
                            },
                            pending: {
                                type: 'boolean',
                            },
                            note: {
                                type: 'string',
                            },
                        },
                    },
                    User: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                            },
                            username: {
                                type: 'string',
                            },
                            email: {
                                type: 'string',
                            },
                            firstName: {
                                type: 'string',
                            },
                            lastName: {
                                type: 'string',
                            },
                            passwordHash: {
                                type: 'string',
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
