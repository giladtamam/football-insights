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
    console.log('DEBUG: DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 60));
    
    // Try raw queries (convert BigInt to string)
    const countryRaw: any = await prisma.$queryRaw`SELECT COUNT(*)::integer as count FROM "Country"`;
    const fixtureRaw: any = await prisma.$queryRaw`SELECT COUNT(*)::integer as count FROM "Fixture"`;
    const teamRaw: any = await prisma.$queryRaw`SELECT COUNT(*)::integer as count FROM "Team"`;
    
    // Also try Prisma methods
    const countryCount = await prisma.country.count();
    const fixtureCount = await prisma.fixture.count();
    
    // Get sample data
    const sampleCountries = await prisma.country.findMany({ take: 3 });
    const sampleFixtures = await prisma.fixture.findMany({ take: 3, include: { homeTeam: true, awayTeam: true } });
    
    res.json({
      status: 'ok',
      database_url: process.env.DATABASE_URL?.substring(0, 50) + '...',
      raw_counts: {
        countries: countryRaw[0]?.count,
        fixtures: fixtureRaw[0]?.count,
        teams: teamRaw[0]?.count,
      },
      prisma_counts: {
        countries: countryCount,
        fixtures: fixtureCount,
      },
      samples: {
        countries: sampleCountries.map(c => c.name),
        fixtures: sampleFixtures.map(f => `${f.homeTeam?.name} vs ${f.awayTeam?.name}`),
      }
    });
  } catch (error: any) {
    console.error('DEBUG ERROR:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
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
