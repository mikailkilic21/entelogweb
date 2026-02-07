import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import { BASE_URL } from '@/constants/Config';

const cache = new InMemoryCache();
const link = new HttpLink({
  uri: `${BASE_URL}/graphql`
});

// Debug logs
console.log('GraphQL URL:', `${BASE_URL}/graphql`);

export const client = new ApolloClient({
  link,
  cache,
});

// Queries
export const GET_PRODUCTS = gql`
  query GetProducts($limit: Int, $offset: Int, $search: String, $warehouseId: Int, $sortBy: String) {
    products(limit: $limit, offset: $offset, search: $search, warehouseId: $warehouseId, sortBy: $sortBy) {
      id
      code
      name
      brand
      stockLevel
      unit
      salesAmount
      salesQuantity
      price
      stockValue
      transitStock
      reservedStock
    }
  }
`;

export const GET_WAREHOUSES = gql`
  query GetWarehouses {
    warehouses {
      id
      name
    }
  }
`;
