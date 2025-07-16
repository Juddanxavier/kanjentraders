# Pagination Component

A reusable pagination component with customizable features for consistent pagination across the application.

## Features

- ✅ **Responsive Design**: Works on mobile and desktop
- ✅ **Rows Per Page**: Configurable page size selector
- ✅ **Smart Page Navigation**: Shows optimal page numbers based on current position
- ✅ **First/Last Buttons**: Optional quick navigation to first/last page
- ✅ **Keyboard Accessible**: Proper ARIA labels and keyboard support
- ✅ **Custom Hook**: `usePagination` hook for state management
- ✅ **TypeScript**: Full TypeScript support
- ✅ **Flexible Configuration**: Customizable options for different use cases

## Installation

The component is already available in `src/components/ui/pagination.tsx`.

## Basic Usage

```tsx
import { Pagination, usePagination } from '@/components/ui/pagination';

function MyTable() {
  const data = [...]; // Your data array
  const pagination = usePagination(data.length, 10, 1);

  const paginatedData = data.slice(
    pagination.startIndex,
    pagination.startIndex + pagination.itemsPerPage
  );

  return (
    <div>
      {/* Your table/content here */}
      <div>
        {paginatedData.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>

      {/* Pagination component */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={data.length}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.handlePageChange}
        onItemsPerPageChange={pagination.handleItemsPerPageChange}
      />
    </div>
  );
}
```

## Advanced Usage with Filtering

```tsx
import { Pagination, usePagination } from '@/components/ui/pagination';

function FilteredTable() {
  const [data, setData] = useState([...]);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter data
  const filteredData = data.filter(item => 
    statusFilter === 'all' || item.status === statusFilter
  );
  
  const pagination = usePagination(filteredData.length, 5, 1);
  
  const paginatedData = filteredData.slice(
    pagination.startIndex,
    pagination.startIndex + pagination.itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    pagination.setCurrentPage(1);
  }, [statusFilter]);

  return (
    <div>
      {/* Filter controls */}
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Table content */}
      <table>
        {paginatedData.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.status}</td>
          </tr>
        ))}
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={filteredData.length}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.handlePageChange}
        onItemsPerPageChange={pagination.handleItemsPerPageChange}
        showRowsPerPage={true}
        showFirstLast={true}
        maxPageButtons={5}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
}
```

## Props

### Pagination Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | - | Current active page |
| `totalPages` | `number` | - | Total number of pages |
| `totalItems` | `number` | - | Total number of items |
| `itemsPerPage` | `number` | - | Items per page |
| `onPageChange` | `(page: number) => void` | - | Callback when page changes |
| `onItemsPerPageChange` | `(itemsPerPage: number) => void` | - | Callback when items per page changes |
| `showRowsPerPage` | `boolean` | `true` | Show rows per page selector |
| `showFirstLast` | `boolean` | `true` | Show first/last page buttons |
| `maxPageButtons` | `number` | `5` | Maximum page number buttons to show |
| `pageSizeOptions` | `number[]` | `[5, 10, 20, 50, 100]` | Available page size options |
| `className` | `string` | `''` | Additional CSS classes |

### usePagination Hook

```tsx
const pagination = usePagination(
  totalItems: number,
  initialItemsPerPage: number = 10,
  initialPage: number = 1
);
```

**Returns:**
- `currentPage`: Current page number
- `itemsPerPage`: Items per page
- `totalPages`: Total number of pages
- `startIndex`: Starting index for current page
- `endIndex`: Ending index for current page
- `handlePageChange`: Function to change page
- `handleItemsPerPageChange`: Function to change items per page
- `setCurrentPage`: Direct page setter
- `setItemsPerPage`: Direct items per page setter

## Examples

### Simple Pagination (No Rows Per Page)

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  showRowsPerPage={false}
  showFirstLast={false}
  maxPageButtons={3}
/>
```

### Minimal Pagination (Small Tables)

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  showRowsPerPage={true}
  showFirstLast={false}
  maxPageButtons={3}
  pageSizeOptions={[10, 25, 50]}
/>
```

### Full-Featured Pagination (Large Tables)

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  showRowsPerPage={true}
  showFirstLast={true}
  maxPageButtons={5}
  pageSizeOptions={[5, 10, 20, 50, 100]}
/>
```

## Styling

The component uses Tailwind CSS classes and follows the existing design system. You can customize the appearance by:

1. **Using the `className` prop** to add additional styles
2. **Modifying the component directly** for global changes
3. **Creating theme variants** using CSS variables

## Best Practices

1. **Use the `usePagination` hook** for consistent state management
2. **Reset to first page** when filters change
3. **Choose appropriate page sizes** based on your data type
4. **Consider mobile users** - the component is responsive by default
5. **Test with different data sizes** to ensure good UX

## Common Patterns

### With Loading States

```tsx
function TableWithLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pagination = usePagination(data.length, 10, 1);

  const handlePageChange = async (page: number) => {
    setIsLoading(true);
    pagination.handlePageChange(page);
    // Fetch data for new page
    await fetchData(page);
    setIsLoading(false);
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {/* Table content */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={data.length}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={pagination.handleItemsPerPageChange}
      />
    </div>
  );
}
```

### With URL Persistence

```tsx
function TableWithURLPersistence() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSize = parseInt(searchParams.get('size') || '10');
  
  const pagination = usePagination(data.length, initialSize, initialPage);

  const handlePageChange = (page: number) => {
    pagination.handlePageChange(page);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    router.push(`?${newParams.toString()}`);
  };

  // Similar for handleItemsPerPageChange
}
```

## Migration Guide

If you're migrating from the old pagination implementation:

1. **Replace manual pagination state** with `usePagination` hook
2. **Replace custom pagination UI** with the `Pagination` component
3. **Update filter reset logic** to use `pagination.setCurrentPage(1)`
4. **Remove manual page calculations** - the hook handles this
5. **Update event handlers** to use the hook's functions

## Troubleshooting

### Pagination Not Showing
- Check that `totalItems > 0`
- Verify that the data array is not empty
- Ensure the component is rendered after data is loaded

### Rows Per Page Not Working
- Verify that `onItemsPerPageChange` is properly connected
- Check that the hook is being used correctly
- Make sure the component re-renders when itemsPerPage changes

### Page Numbers Not Updating
- Ensure `onPageChange` is connected to the hook
- Check that `currentPage` is being updated properly
- Verify that the data slice is using the correct indices
