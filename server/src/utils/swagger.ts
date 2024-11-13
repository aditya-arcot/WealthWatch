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
                    AccessRequest: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The access request id',
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
                            statusId: {
                                type: 'number',
                                description: 'The access request status id',
                            },
                            accessCode: {
                                type: 'string',
                                description: 'The access code',
                            },
                            reviewer: {
                                type: 'string',
                                description: 'The access request reviewer',
                            },
                        },
                    },
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
                    CategorySummary: {
                        type: 'object',
                        properties: {
                            categoryId: {
                                type: 'number',
                                description: 'The category id',
                            },
                            total: {
                                type: 'number',
                                description: 'The category transaction total',
                            },
                            count: {
                                type: 'number',
                                description: 'The category transaction count',
                            },
                        },
                    },
                    CategoryTotalByDate: {
                        type: 'object',
                        properties: {
                            categoryId: {
                                type: 'number',
                                description: 'The category id',
                            },
                            totalByDate: {
                                type: 'array',
                                description:
                                    'The category transaction total by date',
                            },
                        },
                    },
                    CreditCardLiability: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The credit card id',
                            },
                            accountId: {
                                type: 'number',
                                description: 'The account id',
                            },
                            aprs: {
                                type: 'object',
                                description: 'The credit card aprs',
                            },
                            overdue: {
                                type: 'boolean',
                                description: 'The credit card overdue status',
                            },
                            lastPaymentDate: {
                                type: 'date',
                                description:
                                    'The credit card last payment date',
                            },
                            lastPaymentAmount: {
                                type: 'number',
                                description:
                                    'The credit card last payment amount',
                            },
                            lastStatementDate: {
                                type: 'date',
                                description:
                                    'The credit card last statement date',
                            },
                            lastStatementBalance: {
                                type: 'number',
                                description:
                                    'The credit card last statement balance',
                            },
                            nextPaymentDueDate: {
                                type: 'date',
                                description:
                                    'The credit card next payment due date',
                            },
                            minimumPaymentAmount: {
                                type: 'number',
                                description:
                                    'The credit card minimum payment amount',
                            },
                        },
                    },
                    HoldingWithSecurity: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The holding id',
                            },
                            accountId: {
                                type: 'number',
                                description: 'The account id',
                            },
                            name: {
                                type: 'string',
                                description: 'The holding name',
                            },
                            typeId: {
                                type: 'number',
                                description: 'The holding type id',
                            },
                            cashEquivalent: {
                                type: 'boolean',
                                description:
                                    'The holding cash equivalent status',
                            },
                            ticker: {
                                type: 'string',
                                description: 'The holding ticker',
                            },
                            marketCode: {
                                type: 'string',
                                description: 'The holding market code',
                            },
                            price: {
                                type: 'number',
                                description: 'The holding price',
                            },
                            priceAsOf: {
                                type: 'date',
                                description: 'The holding price as of date',
                            },
                            closePrice: {
                                type: 'number',
                                description: 'The holding close price',
                            },
                            closePriceAsOf: {
                                type: 'date',
                                description:
                                    'The holding close price as of date',
                            },
                            quantity: {
                                type: 'number',
                                description: 'The holding quantity',
                            },
                            value: {
                                type: 'number',
                                description: 'The holding value',
                            },
                            costBasis: {
                                type: 'number',
                                description: 'The holding cost basis',
                            },
                            isoCurrencyCode: {
                                type: 'string',
                                description: 'The holding ISO currency code',
                            },
                            unofficialCurrencyCode: {
                                type: 'string',
                                description:
                                    'The holding unofficial currency code',
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
                            lastRefreshed: {
                                type: 'date',
                                description:
                                    'The item last refreshed date by the user',
                            },
                            transactionsLastRefreshed: {
                                type: 'date',
                                description:
                                    'The item transactions last refreshed date by the user',
                            },
                        },
                    },
                    Mortgage: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The mortgage id',
                            },
                            accountId: {
                                type: 'number',
                                description: 'The account id',
                            },
                            type: {
                                type: 'string',
                                description: 'The mortgage type',
                            },
                            interestRateType: {
                                type: 'string',
                                description: 'The mortgage interest rate type',
                            },
                            interestRatePercent: {
                                type: 'number',
                                description:
                                    'The mortgage interest rate percent',
                            },
                            term: {
                                type: 'string',
                                description: 'The mortgage term',
                            },
                            address: {
                                type: 'string',
                                description: 'The mortgage address',
                            },
                            originationDate: {
                                type: 'date',
                                description: 'The mortgage origination date',
                            },
                            originationPrincipal: {
                                type: 'number',
                                description:
                                    'The mortgage origination principal',
                            },
                            maturityDate: {
                                type: 'date',
                                description: 'The mortgage maturity date',
                            },
                            lateFee: {
                                type: 'number',
                                description: 'The mortgage late fee',
                            },
                            escrowBalance: {
                                type: 'number',
                                description: 'The mortgage escrow balance',
                            },
                            prepaymentPenalty: {
                                type: 'boolean',
                                description:
                                    'The mortgage prepayment penalty status',
                            },
                            privateInsurance: {
                                type: 'boolean',
                                description:
                                    'The mortgage private insurance status',
                            },
                            pastDueAmount: {
                                type: 'number',
                                description: 'The mortgage past due amount',
                            },
                            lastPaymentDate: {
                                type: 'date',
                                description: 'The mortgage last payment date',
                            },
                            lastPaymentAmount: {
                                type: 'number',
                                description: 'The mortgage last payment amount',
                            },
                            nextPaymentDueDate: {
                                type: 'date',
                                description:
                                    'The mortgage next payment due date',
                            },
                            nextPaymentAmount: {
                                type: 'number',
                                description: 'The mortgage next payment amount',
                            },
                            ytdInterestPaid: {
                                type: 'number',
                                description: 'The mortgage ytd interest paid',
                            },
                            ytdPrincipalPaid: {
                                type: 'number',
                                description: 'The mortgage ytd principal paid',
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
                    StudentLoanLiability: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'The student loan id',
                            },
                            accountId: {
                                type: 'number',
                                description: 'The account id',
                            },
                            name: {
                                type: 'string',
                                description: 'The student loan name',
                            },
                            interestRatePercent: {
                                type: 'number',
                                description:
                                    'The student loan interest rate percent',
                            },
                            statusTypeId: {
                                type: 'number',
                                description: 'The student loan status type id',
                            },
                            statusEndDate: {
                                type: 'date',
                                description: 'The student loan status end date',
                            },
                            overdue: {
                                type: 'boolean',
                                description: 'The student loan overdue status',
                            },
                            originationDate: {
                                type: 'date',
                                description:
                                    'The student loan origination date',
                            },
                            originationPrincipal: {
                                type: 'number',
                                description:
                                    'The student loan origination principal',
                            },
                            disbursementDates: {
                                type: 'string',
                                description:
                                    'The student loan disbursement dates',
                            },
                            outstandingInterest: {
                                type: 'number',
                                description:
                                    'The student loan outstanding interest',
                            },
                            expectedPayoffDate: {
                                type: 'date',
                                description:
                                    'The student loan expected payoff date',
                            },
                            guarantor: {
                                type: 'string',
                                description: 'The student loan guarantor',
                            },
                            servicerAddress: {
                                type: 'string',
                                description:
                                    'The student loan servicer address',
                            },
                            repaymentPlanTypeId: {
                                type: 'number',
                                description:
                                    'The student loan repayment plan type id',
                            },
                            repaymentPlanDescription: {
                                type: 'string',
                                description:
                                    'The student loan repayment plan description',
                            },
                            lastPaymentDate: {
                                type: 'date',
                                description:
                                    'The student loan last payment date',
                            },
                            lastPaymentAmount: {
                                type: 'number',
                                description:
                                    'The student loan last payment amount',
                            },
                            lastStatementDate: {
                                type: 'date',
                                description:
                                    'The student loan last statement date',
                            },
                            lastStatementBalance: {
                                type: 'number',
                                description:
                                    'The student loan last statement balance',
                            },
                            nextPaymentDueDate: {
                                type: 'date',
                                description:
                                    'The student loan next payment due date',
                            },
                            minimumPaymentAmount: {
                                type: 'number',
                                description:
                                    'The student loan minimum payment amount',
                            },
                            ytdInterestPaid: {
                                type: 'number',
                                description:
                                    'The student loan ytd interest paid',
                            },
                            ytdPrincipalPaid: {
                                type: 'number',
                                description:
                                    'The student loan ytd principal paid',
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
