import { prod, vars } from '@utilities'
import { Request } from 'express'
// eslint-disable-next-line @typescript-eslint/naming-convention
import swaggerJSDoc from 'swagger-jsdoc'
import { SwaggerUiOptions } from 'swagger-ui-express'

export const swaggerUiOptions: SwaggerUiOptions = {
    swaggerOptions: {
        requestInterceptor: async (req: Request) => {
            const port = req.url.split('/')[2]?.split(':')[1] ?? '3000'
            const serverUrl = `http://localhost:${port}`
            const response = await fetch(`${serverUrl}/csrf-token`)
            const data = (await response.json()) as { csrfToken: string }
            req.headers['x-csrf-token'] = data.csrfToken
            return req
        },
    },
}

export const createSwaggerSpec = () => {
    if (prod) throw Error('swagger should not be used in production')
    return swaggerJSDoc(spec)
}

const spec = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: `WealthWatch API - ${vars.nodeEnv}`,
            version: '1.0.0',
        },
        /* eslint-disable @typescript-eslint/naming-convention */
        components: {
            schemas: {
                AccessCode: {
                    type: 'object',
                    properties: {
                        accessCode: {
                            type: 'string',
                        },
                    },
                },
                AccessCodeUserNamePassword: {
                    type: 'object',
                    properties: {
                        accessCode: {
                            type: 'string',
                        },
                        username: {
                            type: 'string',
                        },
                        password: {
                            type: 'string',
                        },
                    },
                },
                AccessRequest: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
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
                            type: 'integer',
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
                            type: 'integer',
                        },
                        itemId: {
                            type: 'integer',
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
                            type: 'integer',
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
                            type: 'integer',
                        },
                        total: {
                            type: 'number',
                        },
                        count: {
                            type: 'integer',
                        },
                    },
                },
                CustomCategoryId: {
                    type: 'object',
                    properties: {
                        customCategoryId: {
                            type: 'integer',
                        },
                    },
                },
                CustomName: {
                    type: 'object',
                    properties: {
                        customName: {
                            type: 'string',
                        },
                    },
                },
                FirstNameLastNameEmail: {
                    type: 'object',
                    properties: {
                        firstName: {
                            type: 'string',
                        },
                        lastName: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                        },
                    },
                },
                Item: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                        },
                        userId: {
                            type: 'integer',
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
                            type: 'string',
                            format: 'date-time',
                        },
                        transactionsLastRefreshed: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                ItemIdNotificationTypeId: {
                    type: 'object',
                    properties: {
                        itemId: {
                            type: 'integer',
                        },
                        notificationTypeId: {
                            type: 'integer',
                        },
                    },
                },
                ItemIdUpdateAccounts: {
                    type: 'object',
                    properties: {
                        itemId: {
                            type: 'integer',
                        },
                        updateAccounts: {
                            type: 'boolean',
                        },
                    },
                },
                ItemWithAccounts: {
                    type: 'object',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Item',
                        },
                    ],
                    properties: {
                        accounts: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Account',
                            },
                        },
                    },
                },
                ItemWithAccountsWithHoldings: {
                    type: 'object',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Item',
                        },
                    ],
                    properties: {
                        accounts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                allOf: [
                                    {
                                        $ref: '#/components/schemas/Account',
                                    },
                                ],
                                properties: {
                                    holdings: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                id: {
                                                    type: 'integer',
                                                },
                                                accountId: {
                                                    type: 'integer',
                                                },
                                                name: {
                                                    type: 'string',
                                                },
                                                typeId: {
                                                    type: 'integer',
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
                                                    type: 'string',
                                                    format: 'date-time',
                                                },
                                                closePrice: {
                                                    type: 'number',
                                                },
                                                closePriceAsOf: {
                                                    type: 'string',
                                                    format: 'date-time',
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
                                    },
                                },
                            },
                        },
                    },
                },
                ItemWithCreditCardAccounts: {
                    type: 'object',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Item',
                        },
                    ],
                    properties: {
                        accounts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                allOf: [
                                    {
                                        $ref: '#/components/schemas/Account',
                                    },
                                ],
                                properties: {
                                    aprs: {
                                        type: 'object',
                                    },
                                    overdue: {
                                        type: 'boolean',
                                    },
                                    lastPaymentDate: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    lastPaymentAmount: {
                                        type: 'number',
                                    },
                                    lastStatementDate: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    lastStatementBalance: {
                                        type: 'number',
                                    },
                                    nextPaymentDueDate: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    minimumPaymentAmount: {
                                        type: 'number',
                                    },
                                },
                            },
                        },
                    },
                },
                ItemWithMortgageAccounts: {
                    type: 'object',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Item',
                        },
                    ],
                    properties: {
                        accounts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                allOf: [
                                    {
                                        $ref: '#/components/schemas/Account',
                                    },
                                ],
                                properties: {
                                    mortgageType: {
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
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    originationPrincipal: {
                                        type: 'number',
                                    },
                                    maturityDate: {
                                        type: 'string',
                                        format: 'date-time',
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
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    lastPaymentAmount: {
                                        type: 'number',
                                    },
                                    nextPaymentDueDate: {
                                        type: 'string',
                                        format: 'date-time',
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
                        },
                    },
                },
                ItemWithStudentLoanAccounts: {
                    type: 'object',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Item',
                        },
                    ],
                    properties: {
                        accounts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                allOf: [
                                    {
                                        $ref: '#/components/schemas/Account',
                                    },
                                ],
                                properties: {
                                    studentLoanName: {
                                        type: 'string',
                                    },
                                    interestRatePercent: {
                                        type: 'number',
                                    },
                                    statusTypeId: {
                                        type: 'integer',
                                    },
                                    statusEndDate: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    overdue: {
                                        type: 'boolean',
                                    },
                                    originationDate: {
                                        type: 'string',
                                        format: 'date-time',
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
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    guarantor: {
                                        type: 'string',
                                    },
                                    servicerAddress: {
                                        type: 'string',
                                    },
                                    repaymentPlanTypeId: {
                                        type: 'integer',
                                    },
                                    repaymentPlanDescription: {
                                        type: 'string',
                                    },
                                    lastPaymentDate: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    lastPaymentAmount: {
                                        type: 'number',
                                    },
                                    lastStatementDate: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    lastStatementBalance: {
                                        type: 'number',
                                    },
                                    nextPaymentDueDate: {
                                        type: 'string',
                                        format: 'date-time',
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
                        },
                    },
                },
                LinkEvent: {
                    type: 'object',
                    properties: {
                        event: {
                            type: 'object',
                        },
                    },
                },
                LinkToken: {
                    type: 'object',
                    properties: {
                        linkToken: {
                            type: 'string',
                        },
                    },
                },
                NameEmail: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                        },
                    },
                },
                Note: {
                    type: 'object',
                    properties: {
                        note: {
                            type: 'string',
                        },
                    },
                },
                Notification: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                        },
                        userId: {
                            type: 'integer',
                        },
                        typeId: {
                            type: 'integer',
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
                PublicTokenMetadata: {
                    type: 'object',
                    properties: {
                        publicToken: {
                            type: 'string',
                        },
                        metadata: {
                            type: 'object',
                        },
                    },
                },
                Secrets: {
                    type: 'object',
                    properties: {
                        logtailToken: {
                            type: 'string',
                        },
                        demoUser: {
                            type: 'string',
                        },
                    },
                },
                StatusId: {
                    type: 'object',
                    properties: {
                        statusId: {
                            type: 'integer',
                        },
                    },
                },
                SpendingCategoryTotals: {
                    type: 'object',
                    properties: {
                        dates: {
                            type: 'array',
                            items: {
                                type: 'string',
                                format: 'date-time',
                            },
                        },
                        totals: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    categoryId: {
                                        type: 'integer',
                                    },
                                    totalByDate: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                date: {
                                                    type: 'string',
                                                    format: 'date-time',
                                                },
                                                total: {
                                                    type: 'number',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                TransactionsAndCounts: {
                    type: 'object',
                    properties: {
                        transactions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'integer',
                                    },
                                    accountId: {
                                        type: 'integer',
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
                                        type: 'integer',
                                    },
                                    customCategoryId: {
                                        type: 'integer',
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
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    pending: {
                                        type: 'boolean',
                                    },
                                    note: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                        filteredCount: {
                            type: 'integer',
                        },
                        totalCount: {
                            type: 'integer',
                        },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
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
                UsernamePassword: {
                    type: 'object',
                    properties: {
                        username: {
                            type: 'string',
                        },
                        password: {
                            type: 'string',
                        },
                    },
                },
            },
            parameters: {
                AccessRequestId: {
                    in: 'path',
                    name: 'requestId',
                    schema: {
                        type: 'integer',
                    },
                    required: true,
                    description: 'The access request id',
                },
                AccountIds: {
                    in: 'query',
                    name: 'accountId',
                    schema: {
                        type: 'array',
                        items: {
                            type: 'integer',
                        },
                    },
                    description: 'The account id(s)',
                },
                CategoryIds: {
                    in: 'query',
                    name: 'categoryId',
                    schema: {
                        type: 'array',
                        items: {
                            type: 'integer',
                        },
                    },
                    description: 'The category id(s)',
                },
                EndDate: {
                    in: 'query',
                    name: 'endDate',
                    schema: {
                        type: 'string',
                        format: 'date-time',
                    },
                    description: 'The end date',
                },
                Limit: {
                    in: 'query',
                    name: 'limit',
                    schema: {
                        type: 'integer',
                    },
                    description: 'The number of transactions to retrieve',
                },
                MaxAmount: {
                    in: 'query',
                    name: 'maxAmount',
                    schema: {
                        type: 'number',
                    },
                    description: 'The maximum amount',
                },
                MinAmount: {
                    in: 'query',
                    name: 'minAmount',
                    schema: {
                        type: 'number',
                    },
                    description: 'The minimum amount',
                },
                NotificationId: {
                    in: 'path',
                    name: 'notificationId',
                    schema: {
                        type: 'integer',
                    },
                    required: true,
                    description: 'The notification id',
                },
                Offset: {
                    in: 'query',
                    name: 'offset',
                    schema: {
                        type: 'integer',
                    },
                    description: 'The number of transactions to skip',
                },
                PlaidItemIdQuery: {
                    in: 'query',
                    name: 'plaidItemId',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                    description: 'The Plaid item id',
                },
                PlaidItemIdPath: {
                    in: 'path',
                    name: 'plaidItemId',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                    description: 'The Plaid item id',
                },
                PlaidTransactionId: {
                    in: 'path',
                    name: 'plaidTransactionId',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                    description: 'The Plaid transaction id',
                },
                SearchQuery: {
                    in: 'query',
                    name: 'searchQuery',
                    schema: {
                        type: 'string',
                    },
                    description: 'The search query',
                },
                StartDate: {
                    in: 'query',
                    name: 'startDate',
                    schema: {
                        type: 'string',
                        format: 'date-time',
                    },
                    description: 'The start date',
                },
                WebhookCode: {
                    in: 'query',
                    name: 'webhookCode',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                    description: 'The webhook code',
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Unauthorized',
                },
            },
        },
        /* eslint-enable @typescript-eslint/naming-convention */
    },
    apis: ['./dist/routes/*.js'],
}
