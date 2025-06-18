# Next.js Frontend Integrace

## Apollo Client Setup

### 1. Instalace závislostí
```bash
npm install @apollo/client graphql
npm install @apollo/experimental-nextjs-app-support  # Pro App Router
```

### 2. Apollo Client konfigurace
```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql'
})

// Auth middleware
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

// Error handling
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
      
      // Unauthorized - redirect to login
      if (extensions?.code === 'UNAUTHORIZED') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    })
  }
  
  if (networkError) {
    console.error(`Network error: ${networkError}`)
  }
})

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            // Pagination merge strategy
            keyArgs: ["filter"],
            merge(existing = { nodes: [], totalCount: 0 }, incoming) {
              return {
                ...incoming,
                nodes: [...existing.nodes, ...incoming.nodes]
              }
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all'
    }
  }
})

export default client
```

### 3. Apollo Provider (App Router)
```typescript
// app/providers.tsx
'use client'
import { ApolloProvider } from '@apollo/client'
import client from '@/lib/apollo-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  )
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

## GraphQL Code Generation

### 1. Setup codegen
```bash
npm install -D @graphql-codegen/cli @graphql-codegen/client-preset
```

### 2. Konfigurace
```yaml
# codegen.yml
overwrite: true
schema: "http://localhost:3000/graphql"
documents: "src/**/*.{ts,tsx}"
generates:
  src/gql/:
    preset: client
    plugins: []
hooks:
  afterAllFileWrite:
    - prettier --write
```

### 3. Package.json scripts
```json
{
  "scripts": {
    "codegen": "graphql-codegen",
    "codegen:watch": "graphql-codegen --watch"
  }
}
```

## Auth Management

### 1. Auth Context
```typescript
// contexts/AuthContext.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '@/gql/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const { data: meData } = useQuery(ME_QUERY, {
    skip: !localStorage.getItem('token'),
    onCompleted: (data) => {
      setUser(data.me)
      setLoading(false)
    },
    onError: () => {
      setLoading(false)
    }
  })
  
  const [loginMutation] = useMutation(LOGIN_MUTATION)
  const [registerMutation] = useMutation(REGISTER_MUTATION)
  
  const login = async (email: string, password: string) => {
    const { data } = await loginMutation({
      variables: { input: { email, password } }
    })
    
    localStorage.setItem('token', data.login.token)
    localStorage.setItem('refreshToken', data.login.refreshToken)
    setUser(data.login.user)
  }
  
  const register = async (email: string, password: string) => {
    const { data } = await registerMutation({
      variables: { input: { email, password } }
    })
    
    localStorage.setItem('token', data.register.token)
    localStorage.setItem('refreshToken', data.register.refreshToken)
    setUser(data.register.user)
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
    window.location.href = '/login'
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## GraphQL Operations

### 1. Product Operations
```typescript
// gql/products.ts
import { gql } from '@apollo/client'

export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilter, $page: Int, $limit: Int) {
    products(filter: $filter, page: $page, limit: $limit) {
      nodes {
        id
        name
        slug
        price
        packagePrice
        customerPrice
        baseUnit
        salesUnit
        unitSize
        packageSize
        inStock
        category {
          name
          slug
        }
      }
      totalCount
      hasNextPage
    }
  }
`

export const GET_PRODUCT = gql`
  query GetProduct($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      price
      packagePrice
      customerPrice
      baseUnit
      salesUnit
      unitSize
      packageSize
      inStock
      stockCount
      category {
        name
        slug
      }
    }
  }
`

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
    }
  }
`
```

### 2. Cart Operations
```typescript
// gql/cart.ts
export const GET_CART = gql`
  query GetCart {
    myCart {
      items {
        product {
          id
          name
          slug
          price
          packagePrice
          customerPrice
          baseUnit
          salesUnit
        }
        quantity
        unitPrice
        total
      }
      total
      itemCount
    }
  }
`

export const ADD_TO_CART = gql`
  mutation AddToCart($input: CartItemInput!) {
    addToCart(input: $input) {
      items {
        product {
          id
          name
        }
        quantity
        total
      }
      total
      itemCount
    }
  }
`

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($input: CartItemInput!) {
    updateCartItem(input: $input) {
      items {
        product {
          id
        }
        quantity
        total
      }
      total
      itemCount
    }
  }
`

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($productId: ID!) {
    removeFromCart(productId: $productId) {
      total
      itemCount
    }
  }
`
```

### 3. Order Operations
```typescript
// gql/orders.ts
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      total
      paymentUrl
      items {
        product {
          name
        }
        quantity
        unitPrice
        total
      }
    }
  }
`

export const GET_MY_ORDERS = gql`
  query GetMyOrders($page: Int, $limit: Int) {
    myOrders(page: $page, limit: $limit) {
      nodes {
        id
        orderNumber
        status
        total
        createdAt
        items {
          product {
            name
          }
          quantity
          total
        }
      }
      totalCount
      hasNextPage
    }
  }
`

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      subtotal
      shippingCost
      total
      paymentUrl
      shippingAddress
      trackingNumber
      createdAt
      items {
        product {
          name
          baseUnit
          salesUnit
        }
        quantity
        unitPrice
        total
      }
    }
  }
`
```

## React Components Examples

### 1. Product List Component
```typescript
// components/ProductList.tsx
'use client'
import { useQuery } from '@apollo/client'
import { GET_PRODUCTS } from '@/gql/products'

interface ProductListProps {
  categoryId?: string
  search?: string
}

export default function ProductList({ categoryId, search }: ProductListProps) {
  const { data, loading, error, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: {
      filter: {
        categoryId,
        search,
        inStock: true
      },
      page: 1,
      limit: 12
    }
  })
  
  if (loading) return <div>Načítám produkty...</div>
  if (error) return <div>Chyba: {error.message}</div>
  
  const products = data?.products?.nodes || []
  
  const loadMore = () => {
    fetchMore({
      variables: {
        page: Math.ceil(products.length / 12) + 1
      }
    })
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {data?.products?.hasNextPage && (
        <button onClick={loadMore} className="mt-8 btn-primary">
          Načíst další
        </button>
      )}
    </div>
  )
}
```

### 2. Cart Hook
```typescript
// hooks/useCart.ts
import { useQuery, useMutation } from '@apollo/client'
import { GET_CART, ADD_TO_CART, UPDATE_CART_ITEM, REMOVE_FROM_CART } from '@/gql/cart'

export function useCart() {
  const { data, loading, refetch } = useQuery(GET_CART)
  
  const [addToCartMutation] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_CART }]
  })
  
  const [updateCartItemMutation] = useMutation(UPDATE_CART_ITEM, {
    refetchQueries: [{ query: GET_CART }]
  })
  
  const [removeFromCartMutation] = useMutation(REMOVE_FROM_CART, {
    refetchQueries: [{ query: GET_CART }]
  })
  
  const addToCart = async (productId: string, quantity: number) => {
    await addToCartMutation({
      variables: {
        input: { productId, quantity }
      }
    })
  }
  
  const updateQuantity = async (productId: string, quantity: number) => {
    await updateCartItemMutation({
      variables: {
        input: { productId, quantity }
      }
    })
  }
  
  const removeItem = async (productId: string) => {
    await removeFromCartMutation({
      variables: { productId }
    })
  }
  
  return {
    cart: data?.myCart,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    refetch
  }
}
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8">
          <h2>Něco se pokazilo!</h2>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="btn-primary mt-4"
          >
            Zkusit znovu
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
``` 