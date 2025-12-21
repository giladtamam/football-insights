import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useAuthStore } from "./auth-store";

const httpLink = createHttpLink({
  // @ts-ignore
  uri: import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql",
  credentials: "include",
});

// Add auth header to requests
const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          fixtures: {
            keyArgs: ["filter"],
            merge(_, incoming) {
              return [...incoming];
            },
          },
        },
      },
      Fixture: {
        keyFields: ["id"],
      },
      Team: {
        keyFields: ["id"],
      },
      League: {
        keyFields: ["id"],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});
