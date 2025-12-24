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

app.listen(port, () => {
  console.log(`🚀 GraphQL Server ready at http://0.0.0.0:${port}/graphql`);
  console.log(`Health check at http://0.0.0.0:${port}/health`);
});
