import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
  credentials: 'include',
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          fixtures: {
            keyArgs: ['filter'],
            merge(existing = [], incoming) {
              return [...incoming]
            },
          },
        },
      },
      Fixture: {
        keyFields: ['id'],
      },
      Team: {
        keyFields: ['id'],
      },
      League: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

