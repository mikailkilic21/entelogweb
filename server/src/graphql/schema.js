const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Product {
    id: Int!
    code: String!
    name: String
    brand: String
    stockLevel: Float
    unit: String
    price: Float
    salesAmount: Float
    salesQuantity: Float
    stockValue: Float
    transitStock: Float
    reservedStock: Float
  }

  type Warehouse {
    id: Int!
    number: Int
    name: String
  }

  type Account {
    id: Int!
    code: String!
    name: String
    city: String
    balance: Float
    currency: String
    email: String
    phone: String
  }

  type Query {
    products(limit: Int, offset: Int, search: String, warehouseId: Int, sortBy: String): [Product]
    product(id: Int!): Product
    warehouses: [Warehouse]
    accounts(limit: Int, search: String): [Account]
  }
`;

module.exports = typeDefs;
