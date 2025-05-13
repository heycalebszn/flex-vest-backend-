const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'FlexVest API',
    description: 'API documentation for FlexVest - A crypto savings platform',
    version: '1.0.0',
    contact: {
      name: 'FlexVest Support',
      email: 'support@flexvest.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.flexvest.com/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          phone: {
            type: 'string'
          },
          walletAddress: {
            type: 'string'
          },
          twoFactorEnabled: {
            type: 'boolean'
          },
          totalBalance: {
            type: 'number'
          },
          flexSave: {
            type: 'object',
            properties: {
              balance: {
                type: 'number'
              }
            }
          },
          goalSave: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                targetAmount: { type: 'number' },
                currentAmount: { type: 'number' },
                deadline: { type: 'string', format: 'date-time' }
              }
            }
          },
          fixedSave: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                amount: { type: 'number' },
                interestRate: { type: 'number' },
                startDate: { type: 'string', format: 'date-time' },
                maturityDate: { type: 'string', format: 'date-time' },
                isMatured: { type: 'boolean' }
              }
            }
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended']
          }
        }
      },
      Transaction: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['deposit', 'withdrawal', 'interest', 'referral_bonus', 'transfer']
          },
          savingsType: {
            type: 'string',
            enum: ['flex', 'goal', 'fixed']
          },
          amount: {
            type: 'number'
          },
          currency: {
            type: 'string',
            enum: ['USDT', 'USDC']
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed']
          },
          method: {
            type: 'string',
            enum: ['wallet', 'bank_transfer', 'internal']
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            default: false
          },
          message: {
            type: 'string'
          }
        }
      }
    }
  },
  paths: {
    // Authentication Routes
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  phone: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    twoFactorSecret: { type: 'string' },
                    qrCode: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  twoFactorCode: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        phone: { type: 'string' },
                        twoFactorEnabled: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'New access token generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Invalid refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/enable-2fa': {
      post: {
        tags: ['Authentication'],
        summary: 'Enable two-factor authentication',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['twoFactorCode'],
                properties: {
                  twoFactorCode: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '2FA enabled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid 2FA code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/disable-2fa': {
      post: {
        tags: ['Authentication'],
        summary: 'Disable two-factor authentication',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password', 'twoFactorCode'],
                properties: {
                  password: { type: 'string' },
                  twoFactorCode: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '2FA disabled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials or 2FA code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/request-password-reset': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Savings Routes
    '/savings/summary': {
      get: {
        tags: ['Savings'],
        summary: 'Get user\'s savings summary',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Savings summary retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalBalance: { type: 'number' },
                        summary: {
                          type: 'object',
                          properties: {
                            flexSave: { type: 'number' },
                            goalSave: { type: 'number' },
                            fixedSave: { type: 'number' }
                          }
                        },
                        recentTransactions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Transaction' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/savings/flex/deposit': {
      post: {
        tags: ['Savings'],
        summary: 'Deposit to Flex Save',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number' },
                  currency: { 
                    type: 'string',
                    enum: ['USDT', 'USDC'],
                    default: 'USDT'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Deposit successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    transaction: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/savings/flex/withdraw': {
      post: {
        tags: ['Savings'],
        summary: 'Withdraw from Flex Save',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'withdrawalAddress'],
                properties: {
                  amount: { type: 'number' },
                  currency: { 
                    type: 'string',
                    enum: ['USDT', 'USDC'],
                    default: 'USDT'
                  },
                  withdrawalAddress: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Withdrawal successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    transaction: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input or insufficient balance',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/savings/history': {
      get: {
        tags: ['Savings'],
        summary: 'Get savings transaction history',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'type',
            schema: {
              type: 'string',
              enum: ['flex', 'goal', 'fixed']
            },
            description: 'Filter by savings type'
          },
          {
            in: 'query',
            name: 'page',
            schema: {
              type: 'integer',
              minimum: 1
            },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100
            },
            description: 'Number of items per page'
          }
        ],
        responses: {
          '200': {
            description: 'Transaction history retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        transactions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Transaction' }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            pages: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/savings/goal/create': {
      post: {
        tags: ['Savings'],
        summary: 'Create a new savings goal',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'targetAmount', 'deadline'],
                properties: {
                  name: { type: 'string' },
                  targetAmount: { type: 'number' },
                  deadline: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Goal created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    goal: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        targetAmount: { type: 'number' },
                        currentAmount: { type: 'number' },
                        deadline: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/savings/goal/deposit': {
      post: {
        tags: ['Savings'],
        summary: 'Deposit to a savings goal',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'goalId'],
                properties: {
                  amount: { type: 'number' },
                  goalId: { type: 'string' },
                  currency: { 
                    type: 'string',
                    enum: ['USDT', 'USDC'],
                    default: 'USDT'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Deposit successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    transaction: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/savings/fixed/create': {
      post: {
        tags: ['Savings'],
        summary: 'Create a new fixed savings plan',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'duration'],
                properties: {
                  amount: { type: 'number' },
                  duration: { 
                    type: 'integer',
                    minimum: 1,
                    maximum: 24,
                    description: 'Duration in months'
                  },
                  currency: { 
                    type: 'string',
                    enum: ['USDT', 'USDC'],
                    default: 'USDT'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Fixed savings plan created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    fixedSave: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        amount: { type: 'number' },
                        interestRate: { type: 'number' },
                        startDate: { type: 'string', format: 'date-time' },
                        maturityDate: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Analytics Routes
    '/analytics/growth': {
      get: {
        tags: ['Analytics'],
        summary: 'Get growth analytics',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'period',
            schema: {
              type: 'string',
              enum: ['1m', '3m', '6m', '1y'],
              default: '1y'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Growth analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        growthChart: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              date: { type: 'string', format: 'date' },
                              balance: { type: 'number' },
                              balanceNaira: { type: 'number' }
                            }
                          }
                        },
                        interestEarned: { type: 'number' },
                        savingsDistribution: {
                          type: 'object',
                          properties: {
                            flexSave: { type: 'number' },
                            goalSave: { type: 'number' },
                            fixedSave: { type: 'number' }
                          }
                        },
                        totalBalance: { type: 'number' },
                        totalBalanceNaira: { type: 'number' },
                        exchangeRate: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/analytics/goals-progress': {
      get: {
        tags: ['Analytics'],
        summary: 'Get goals progress analytics',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Goals progress retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          goalId: { type: 'string' },
                          name: { type: 'string' },
                          targetAmount: { type: 'number' },
                          currentAmount: { type: 'number' },
                          percentageComplete: { type: 'number' },
                          daysRemaining: { type: 'number' },
                          deadline: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/analytics/fixed-savings': {
      get: {
        tags: ['Analytics'],
        summary: 'Get fixed savings analytics',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Fixed savings analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          amount: { type: 'number' },
                          interestRate: { type: 'number' },
                          interestEarned: { type: 'number' },
                          startDate: { type: 'string', format: 'date-time' },
                          maturityDate: { type: 'string', format: 'date-time' },
                          daysRemaining: { type: 'integer' },
                          percentageComplete: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/analytics/exchange-rates': {
      get: {
        tags: ['Analytics'],
        summary: 'Get exchange rate history',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'days',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 365,
              default: 30
            },
            description: 'Number of days of history to retrieve'
          }
        ],
        responses: {
          '200': {
            description: 'Exchange rate history retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', format: 'date' },
                          rate: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Referral Routes
    '/referrals/stats': {
      get: {
        tags: ['Referrals'],
        summary: 'Get referral statistics',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Referral stats retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        referralCode: { type: 'string' },
                        referralCount: { type: 'number' },
                        referralEarnings: { type: 'number' },
                        referredUsers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              email: { type: 'string' },
                              createdAt: { type: 'string', format: 'date-time' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/referrals/apply': {
      post: {
        tags: ['Referrals'],
        summary: 'Apply a referral code',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['referralCode'],
                properties: {
                  referralCode: { 
                    type: 'string',
                    pattern: '^[A-Z0-9]{6}$'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Referral code applied successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    bonus: { type: 'number' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid referral code or already applied',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/referrals/generate-code': {
      post: {
        tags: ['Referrals'],
        summary: 'Generate a new referral code',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'New referral code generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    referralCode: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Could not generate referral code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/referrals/history': {
      get: {
        tags: ['Referrals'],
        summary: 'Get referral history',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: {
              type: 'integer',
              minimum: 1
            },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100
            },
            description: 'Number of items per page'
          }
        ],
        responses: {
          '200': {
            description: 'Referral history retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        referrals: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              referredUser: { type: 'string' },
                              bonusAmount: { type: 'number' },
                              createdAt: { type: 'string', format: 'date-time' }
                            }
                          }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            pages: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints'
    },
    {
      name: 'Savings',
      description: 'Savings management endpoints'
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints'
    },
    {
      name: 'Referrals',
      description: 'Referral program endpoints'
    }
  ]
};

module.exports = swaggerConfig;