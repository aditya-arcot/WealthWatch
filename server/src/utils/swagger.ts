import swaggerJSDoc from 'swagger-jsdoc'

export const createSwaggerSpec = () => {
    const options = {
        definition: {
            openapi: '3.1.0',
            info: {
                title: 'WealthWatch API',
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
                    Category: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: 'The category ID',
                            },
                            name: {
                                type: 'string',
                                description: 'The category name',
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
                                type: 'string',
                                description: 'The transaction ID',
                            },
                            accountId: {
                                type: 'string',
                                description: 'The account ID',
                            },
                            categoryId: {
                                type: 'string',
                                description: 'The category ID',
                            },
                            amount: {
                                type: 'number',
                                description: 'The transaction amount',
                            },
                            description: {
                                type: 'string',
                                description: 'The transaction description',
                            },
                            timestamp: {
                                type: 'string',
                                description: 'The transaction timestamp',
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
