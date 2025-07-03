import { config } from '@keystone-6/core';
import { statelessSessions } from '@keystone-6/core/session';
import { createAuth } from '@keystone-6/auth';

// Import our schema definitions
import { lists } from './schema';

// Set up our session configuration
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  console.warn('⚠️  SESSION_SECRET not found, using temporary secret for development');
}

const session = statelessSessions({
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secret: sessionSecret || 'dev-only-secret-replace-in-production',
});

// Set up auth
const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  sessionData: 'id email firstName lastName roles schoolSystem { id }',
  secretField: 'password',
  initFirstItem: {
    fields: ['firstName', 'lastName', 'email', 'password', 'roles'],
  },
});

export default withAuth(
  config({
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://torqueed:password@localhost:5432/torqueed_dev',
      onConnect: async (context) => {
        console.log('Connected to database');
      },
      // Enable logging in development
      enableLogging: process.env.NODE_ENV === 'development',
    },
    lists,
    session,
    ui: {
      isAccessAllowed: (context) => !!context.session,
    },
    graphql: {
      playground: process.env.NODE_ENV !== 'production',
    },
    server: {
      cors: {
        origin: [process.env.FRONTEND_URL || 'http://localhost:3030'],
        credentials: true,
      },
      port: parseInt(process.env.PORT || '3030'),
    },
  })
);