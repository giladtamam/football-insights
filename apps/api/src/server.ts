import 'dotenv/config';
import express from 'express';
import { createYoga } from 'graphql-yoga';
import { schema } from './schema';
import { prisma } from '@football-insights/database';
import type { Context } from './schema/builder';
import { verifyToken } from './services/auth';

const app = express();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/', (_req, res) => {
  res.status(200).send('Football Insights API');
});

// Debug endpoint to check database connection
app.get('/debug', async (_req, res) => {
  try {
    // Log the query
    console.log('DEBUG: Querying database...');
    console.log('DEBUG: DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 60));
    
    const countryCount = await prisma.country.count();
    console.log('DEBUG: Country count:', countryCount);
    
    const fixtureCount = await prisma.fixture.count();
    console.log('DEBUG: Fixture count:', fixtureCount);
    
    const teamCount = await prisma.team.count();
    console.log('DEBUG: Team count:', teamCount);
    
    // Try raw query
    const rawCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Country"`;
    console.log('DEBUG: Raw query result:', rawCount);
    
    res.json({
      status: 'ok',
      database_url: process.env.DATABASE_URL?.substring(0, 50) + '...',
      counts: {
        countries: countryCount,
        fixtures: fixtureCount,
        teams: teamCount,
      },
      rawCount,
    });
  } catch (error: any) {
    console.error('DEBUG ERROR:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
      database_url: process.env.DATABASE_URL?.substring(0, 50) + '...',
    });
  }
});

const yoga = createYoga<{}, Context>({
  schema,
  graphiql: true,
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:3000',
      'https://football-insights-web.vercel.app',
    ],
    credentials: true,
  },
  context: async ({ request }) => {
    let userId: number | undefined;

    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    return {
      prisma,
      userId,
    };
  },
});

// Mount GraphQL endpoint
app.use('/graphql', yoga);

const port = process.env.PORT || 4000;

// Handle uncaught errors to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const server = app.listen(port, () => {
  console.log(`🚀 GraphQL Server ready at http://0.0.0.0:${port}/graphql`);
  console.log(`Health check at http://0.0.0.0:${port}/health`);
});

// Keep the server alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
