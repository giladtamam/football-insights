import 'dotenv/config';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { schema } from './schema';
import { prisma } from '@football-insights/database';
import type { Context } from './schema/builder';
import { verifyToken } from './services/auth';

const yoga = createYoga<{}, Context>({
  schema,
  graphiql: true,
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
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

const server = createServer(yoga);

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(`🚀 GraphQL Server ready at http://localhost:${port}/graphql`);
});

