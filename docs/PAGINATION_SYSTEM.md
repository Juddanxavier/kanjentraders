# Redis-Backed Pagination System

This document describes the implementation of a high-performance pagination system using Redis for caching and Zustand for state management.

## Overview

The pagination system provides:
- **Server-side pagination** with Redis caching
- **Global state management** using Zustand
- **Real-time search** with debounced queries
- **Advanced filtering** and sorting capabilities
- **Bulk operations** across multiple pages
- **Automatic cache invalidation** on data mutations

## Architecture

### Core Components

1. **PaginationService** (`src/lib/services/pagination-service.ts`)
   - Handles server-side pagination logic
   - Manages Redis caching with configurable TTL
   - Provides generic pagination methods for different tables

2. **PaginationStore** (`src/lib/store/pagination-store.ts`)
   - Zustand store for global pagination state
   - Persists pagination state across page navigations
   - Manages state for multiple tables independently

3. **useServerPagination** (`src/hooks/use-server-pagination.ts`)
   - React hook for server-side pagination
   - Integrates with API endpoints
   - Provides actions for state updates

4. **API Routes** (`src/pages/api/pagination/`)
   - RESTful endpoints for paginated data
   - Integrates with PaginationService
   - Handles query parameters and response formatting

## Usage

### Basic Implementation

```typescript
import { useLeadsPagination } from '@/hooks/use-server-pagination';

function MyComponent() {
  const {
    data,
    isLoading,
    error,
    pagination,
    actions,
  } = useLeadsPagination({
    enabled: true,
    onDataChange: (data, paginationData) => {
      // Handle data changes
    },
  });

  return (
    <div>
      {/* Your table component */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={actions.goToPage}
        onItemsPerPageChange={actions.changeItemsPerPage}
      />
    </div>
  );
}
```

### Available Actions

```typescript
// Navigate to specific page
actions.goToPage(2);

// Change items per page
actions.changeItemsPerPage(25);

// Update filters
actions.updateFilters({ status: 'NEW', origin: 'New York' });

// Update search query
actions.updateSearchQuery('john@example.com');

// Update sorting
actions.updateSorting('name', 'asc');

// Refresh data
actions.refetch();

// Reset pagination state
actions.reset();
```

### Pagination Store

The Zustand store provides centralized state management:

```typescript
import { usePaginationStore } from '@/lib/store/pagination-store';

function MyComponent() {
  const {
    getPaginationState,
    setCurrentPage,
    setFilters,
    resetPagination,
  } = usePaginationStore();

  const leadsPagination = getPaginationState('leads');
  
  // Update pagination state
  setCurrentPage('leads', 2);
  setFilters('leads', { status: 'NEW' });
  resetPagination('leads');
}
```

## API Integration

### Request Format

```
GET /api/pagination/leads?page=1&limit=10&sortBy=name&sortOrder=asc&status=NEW&searchQuery=john
```

### Response Format

```json
{
  "data": [
    {
      "id": "lead-1",
      "name": "John Doe",
      "email": "john@example.com",
      // ... other fields
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Caching Strategy

### Cache Keys

The system uses hierarchical cache keys:
- Data cache: `pagination:{table}:{page}:{limit}:{sortKey}:{filters}:{searchQuery}`
- Count cache: `pagination:count:{table}:{filters}:{searchQuery}`

### Cache TTL

Different tables have different cache durations:
- Leads: 3 minutes (frequently updated)
- Users: 5 minutes (moderate updates)
- Shipments: 1 minute (real-time updates)

### Cache Invalidation

Automatic cache invalidation occurs when:
- Data is created, updated, or deleted
- Bulk operations are performed
- Manual cache refresh is triggered

```typescript
import { CacheInvalidator } from '@/lib/utils/cache-invalidation';

// Invalidate specific table cache
await CacheInvalidator.invalidateLeadsCache();

// Invalidate all caches
await CacheInvalidator.invalidateAllCaches();
```

## Performance Optimizations

### Debounced Search

Search queries are debounced to prevent excessive API calls:

```typescript
const debouncedSearchQuery = useDebounce(searchInput, 300);
```

### Efficient Filtering

Filters are applied server-side to reduce data transfer:

```typescript
const filters = {
  status: 'NEW',
  origin: 'New York',
  destination: 'Los Angeles',
};
```

### Smart Pagination

The system automatically:
- Resets to page 1 when filters change
- Preserves state across component re-renders
- Handles edge cases (empty results, invalid pages)

## Error Handling

The system provides robust error handling:

```typescript
const { data, error, isLoading } = useLeadsPagination();

if (error) {
  // Handle error state
  return <ErrorMessage error={error} onRetry={actions.refetch} />;
}
```

## Testing

### Unit Tests

Test pagination logic independently:

```typescript
import { PaginationService } from '@/lib/services/pagination-service';

describe('PaginationService', () => {
  it('should paginate leads correctly', async () => {
    const result = await PaginationService.paginateLeads({
      page: 1,
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    
    expect(result.data).toHaveLength(10);
    expect(result.pagination.currentPage).toBe(1);
  });
});
```

### Integration Tests

Test the full pagination flow:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { useLeadsPagination } from '@/hooks/use-server-pagination';

// Test pagination hook integration
```

## Migration Guide

### From Client-Side to Server-Side

1. Replace client-side pagination hooks with server-side hooks
2. Update API endpoints to use PaginationService
3. Integrate cache invalidation in mutation operations
4. Update UI components to use new pagination state

### Example Migration

**Before:**
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [filteredData, setFilteredData] = useState([]);
const totalPages = Math.ceil(filteredData.length / itemsPerPage);
```

**After:**
```typescript
const { data, pagination, actions } = useLeadsPagination();
```

## Troubleshooting

### Common Issues

1. **Cache not updating**: Ensure cache invalidation is called after mutations
2. **Slow performance**: Check Redis connection and query optimization
3. **State not persisting**: Verify Zustand store persistence configuration
4. **Filter not working**: Check API endpoint parameter handling

### Debug Mode

Enable debug mode to see cache hits and misses:

```typescript
const { data, isLoading } = useLeadsPagination({ debug: true });
```

## Best Practices

1. **Use appropriate cache TTL** based on data update frequency
2. **Implement proper error boundaries** for API failures
3. **Debounce search inputs** to prevent excessive requests
4. **Validate pagination parameters** on the server side
5. **Monitor cache hit rates** for optimization opportunities

## Future Enhancements

- [ ] Add support for infinite scrolling
- [ ] Implement pagination preloading
- [ ] Add analytics for pagination patterns
- [ ] Support for complex filtering operators
- [ ] Real-time updates via WebSocket integration
