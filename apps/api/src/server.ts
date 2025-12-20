import 'dotenv/config';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { schema } from './schema';
import { prisma } from '@football-insights/database';
import type { Context } from './schema/builder';

const yoga = createYoga<{}, Context>({
  schema,
  graphiql: true,
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  },
  context: () => ({
    prisma,
    userId: undefined, // Will be set when auth is implemented
  }),
});

const server = createServer(yoga);

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(`🚀 GraphQL Server ready at http://localhost:${port}/graphql`);
});

