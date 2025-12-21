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
    origin: '*',  // Allow all origins (you can restrict this later)
    credentials: false,
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

