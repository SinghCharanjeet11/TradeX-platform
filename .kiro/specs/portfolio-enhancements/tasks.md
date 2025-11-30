# Implementation Plan

- [ ] 1. Database schema updates and migrations
- [x] 1.1 Create portfolio_snapshots table migration


  - Write SQL migration for portfolio_snapshots table with indexes
  - _Requirements: 2.1, 2.2_



- [x] 1.2 Create price_history table migration


  - Write SQL migration for price_history table with indexes
  - _Requirements: 4.1, 4.2_



- [ ] 1.3 Enhance holdings table with new columns
  - Add account and notes columns to holdings table
  - Create indexes for pagination queries
  - _Requirements: 1.1, 1.2_




- [x] 1.4 Run database migrations

  - Execute all migrations in correct order
  - Verify tables and indexes created successfully
  - _Requirements: 1.1, 2.1, 4.1_


- [ ] 2. Backend: Holdings CRUD operations
- [ ] 2.1 Implement createHolding in repository
  - Add createHolding method to holdingsRepository
  - Handle duplicate detection and merging logic


  - _Requirements: 1.2, 1.7_

- [ ] 2.2 Implement updateHolding in repository
  - Add updateHolding method to holdingsRepository


  - Include validation and authorization checks
  - _Requirements: 1.4_

- [ ] 2.3 Implement deleteHolding in repository
  - Add deleteHolding method to holdingsRepository


  - Add bulkDeleteHoldings method for multiple deletions
  - _Requirements: 1.6, 8.6_

- [x] 2.4 Enhance holdingsService with CRUD business logic

  - Add validation methods for holding data
  - Implement duplicate merge calculation
  - Add methods for recalculating derived values
  - _Requirements: 1.2, 1.4, 1.7, 1.8_


- [ ] 2.5 Create holdings CRUD controller endpoints
  - POST /api/holdings - Create holding
  - PUT /api/holdings/:id - Update holding
  - DELETE /api/holdings/:id - Delete holding


  - DELETE /api/holdings/bulk - Bulk delete
  - _Requirements: 1.2, 1.4, 1.6, 8.6_

- [x] 2.6 Add holdings routes with authentication


  - Register new CRUD routes in server
  - Apply auth middleware to all routes
  - _Requirements: 1.2, 1.4, 1.6_



- [ ] 3. Backend: Pagination implementation
- [ ] 3.1 Add pagination to holdingsRepository
  - Implement getHoldingsPaginated method with LIMIT/OFFSET


  - Add total count query for pagination metadata
  - _Requirements: 5.1, 5.2, 5.3_



- [ ] 3.2 Enhance holdingsService with pagination logic
  - Add pagination parameter handling
  - Calculate total pages and metadata
  - Maintain sort order with pagination


  - _Requirements: 5.2, 5.3, 5.4, 5.6_

- [ ] 3.3 Update holdings controller for pagination
  - Modify GET /api/holdings to accept page and pageSize params


  - Return pagination metadata in response
  - _Requirements: 5.1, 5.2, 5.3, 5.4_



- [ ] 4. Backend: Performance and analytics
- [ ] 4.1 Create performanceRepository
  - Implement methods to query portfolio_snapshots


  - Add methods to aggregate data by time range
  - _Requirements: 2.1, 2.2_

- [ ] 4.2 Create performanceService
  - Implement getPerformanceData method with time range filtering
  - Implement createDailySnapshot method for cron job
  - Implement calculateAllocation method for asset distribution
  - _Requirements: 2.1, 2.2, 3.1, 3.3_

- [ ] 4.3 Create performanceController
  - GET /api/portfolio/performance - Get performance data
  - GET /api/portfolio/allocation - Get allocation data
  - _Requirements: 2.1, 2.2, 3.1_

- [ ] 4.4 Add performance routes
  - Register performance routes in server
  - Apply auth middleware
  - _Requirements: 2.1, 3.1_

- [ ] 5. Backend: Real-time price updates
- [ ] 5.1 Create priceUpdateService
  - Implement refreshPrices method to fetch from external APIs
  - Implement getCurrentPrices method
  - Add retry logic for failed requests
  - _Requirements: 4.1, 4.2, 4.6_

- [ ] 5.2 Create priceController
  - GET /api/prices/current - Get current prices
  - POST /api/prices/refresh - Trigger manual refresh
  - _Requirements: 4.1, 4.2_

- [ ] 5.3 Add price routes
  - Register price routes in server
  - Apply auth middleware
  - _Requirements: 4.1_

- [ ] 5.4 Implement price update polling mechanism
  - Create background job to update prices periodically
  - Store price history in price_history table
  - _Requirements: 4.1, 4.2_

- [ ] 6. Frontend: Holdings service enhancements
- [ ] 6.1 Add CRUD methods to holdingsService
  - Implement createHolding API call
  - Implement updateHolding API call
  - Implement deleteHolding API call
  - Implement bulkDeleteHoldings API call
  - _Requirements: 1.2, 1.4, 1.6, 8.6_

- [ ] 6.2 Add pagination support to holdingsService
  - Update getHoldings to accept page and pageSize params
  - Handle pagination metadata in response
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7. Frontend: Performance and price services
- [ ] 7.1 Create performanceService
  - Implement getPerformanceData API call
  - Implement getAllocationData API call
  - Add time range parameter handling
  - _Requirements: 2.1, 2.2, 3.1_

- [ ] 7.2 Create priceService
  - Implement getCurrentPrices API call
  - Implement refreshPrices API call
  - Add polling start/stop methods
  - _Requirements: 4.1, 4.2_

- [ ] 8. Frontend: Custom hooks
- [ ] 8.1 Enhance useHoldings hook
  - Add pagination state management
  - Add selection state management (selectedIds)
  - Add CRUD operation methods
  - Add optimistic update logic
  - _Requirements: 1.2, 1.4, 1.6, 5.1, 5.2, 8.2, 8.3_

- [ ] 8.2 Create usePerformance hook
  - Implement data fetching for performance and allocation
  - Add time range state management
  - Add loading and error states
  - _Requirements: 2.1, 2.2, 3.1_

- [ ] 8.3 Create useRealtime hook
  - Implement polling logic with setInterval
  - Add start/stop polling methods
  - Track last update timestamp
  - Clean up on unmount
  - _Requirements: 4.1, 4.4, 4.5_

- [ ] 8.4 Create usePagination hook
  - Implement reusable pagination state logic
  - Add page navigation methods
  - Calculate total pages
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Frontend: Add/Edit Holding Modal
- [ ] 9.1 Create AddEditHoldingModal component
  - Build modal structure with form fields
  - Implement controlled form inputs
  - Add asset type dropdown
  - Add save and cancel buttons
  - _Requirements: 1.1, 1.3_

- [ ] 9.2 Implement form validation
  - Add validation rules for all fields
  - Display inline error messages
  - Prevent submission with invalid data
  - _Requirements: 1.8_

- [ ] 9.3 Integrate modal with CRUD operations
  - Connect to createHolding for add mode
  - Connect to updateHolding for edit mode
  - Handle loading states during submission
  - Show success/error feedback
  - _Requirements: 1.2, 1.4_

- [ ] 9.4 Add modal styling
  - Style modal with consistent design system
  - Make responsive for mobile (full-screen)
  - Add animations for open/close
  - _Requirements: 6.1, 6.2, 10.4_

- [ ] 10. Frontend: Performance Chart
- [ ] 10.1 Create PerformanceChart component
  - Install and configure Recharts library
  - Build line chart with Recharts components
  - Add time range selector buttons
  - _Requirements: 2.1, 2.2_

- [ ] 10.2 Implement chart data rendering
  - Format data for Recharts
  - Configure X and Y axes
  - Add gridlines and labels
  - _Requirements: 2.7_

- [ ] 10.3 Add conditional styling based on performance
  - Apply green color for positive performance
  - Apply red color for negative performance
  - _Requirements: 2.3, 2.4_

- [ ] 10.4 Implement custom tooltip
  - Create custom tooltip component
  - Display date, value, and percentage change
  - Style tooltip consistently
  - _Requirements: 2.5_

- [ ] 10.5 Add loading and empty states
  - Create skeleton loader for chart
  - Add empty state for insufficient data
  - _Requirements: 2.6, 9.1, 9.2_

- [ ] 10.6 Make chart responsive
  - Adjust height for mobile devices
  - Ensure touch-friendly interactions
  - _Requirements: 10.1, 10.2_

- [ ] 11. Frontend: Asset Allocation Chart
- [ ] 11.1 Create AssetAllocationChart component
  - Build donut chart with Recharts PieChart
  - Configure inner and outer radius
  - Add center text showing total value
  - _Requirements: 3.1_

- [ ] 11.2 Implement color-coded segments
  - Apply consistent colors for asset types
  - Match colors with asset type badges
  - _Requirements: 3.4_

- [ ] 11.3 Add hover tooltip
  - Create custom tooltip for segments
  - Display asset type, value, and percentage
  - _Requirements: 3.2_

- [ ] 11.4 Implement segment click filtering
  - Add onClick handler to segments
  - Trigger holdings table filter on click
  - _Requirements: 3.5_

- [ ] 11.5 Filter empty asset types
  - Exclude asset types with zero holdings from chart
  - _Requirements: 3.3_

- [ ] 11.6 Add loading and empty states
  - Create skeleton loader for donut chart
  - Add empty state for no holdings
  - _Requirements: 3.6, 9.1, 9.2_

- [ ] 12. Frontend: Enhanced Holdings Table
- [ ] 12.1 Add checkbox column to table
  - Add checkbox to table header
  - Add checkbox to each row
  - Style checkboxes consistently
  - _Requirements: 8.1_

- [ ] 12.2 Implement selection logic
  - Handle row checkbox toggle
  - Handle header checkbox toggle (select all)
  - Update selectedIds state
  - _Requirements: 8.2, 8.3_

- [ ] 12.3 Add action column with icons
  - Add Edit and Delete icons to each row
  - Show icons on row hover
  - Style icons consistently
  - _Requirements: 1.3, 1.5_

- [ ] 12.4 Connect actions to handlers
  - Wire Edit icon to open modal with holding data
  - Wire Delete icon to open confirmation dialog
  - _Requirements: 1.3, 1.5_

- [ ] 12.5 Add loading skeleton rows
  - Create SkeletonTableRow component
  - Display skeletons during initial load
  - Match table structure
  - _Requirements: 9.1, 9.2_

- [ ] 13. Frontend: Pagination Controls
- [ ] 13.1 Create PaginationControls component
  - Build pagination UI with buttons
  - Add Previous/Next buttons
  - Add page number buttons
  - Add page size selector
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 13.2 Implement pagination logic
  - Handle page changes
  - Handle page size changes
  - Disable buttons appropriately
  - _Requirements: 5.2, 5.3_

- [ ] 13.3 Display pagination metadata
  - Show current page and total pages
  - Show items count ("Showing 1-20 of 150")
  - _Requirements: 5.4_

- [ ] 13.4 Add conditional rendering
  - Show pagination only when items > 20
  - Hide pagination when items <= 20
  - _Requirements: 5.1, 5.7_

- [ ] 13.5 Style pagination controls
  - Apply consistent design system
  - Make responsive for mobile
  - _Requirements: 6.1, 6.2_

- [ ] 14. Frontend: Bulk Actions Toolbar
- [ ] 14.1 Create BulkActionsToolbar component
  - Build toolbar UI with action buttons
  - Add Delete Selected button
  - Add Export Selected button
  - Add Clear Selection button
  - _Requirements: 8.4, 8.5, 8.7_

- [ ] 14.2 Implement conditional rendering
  - Show toolbar only when items selected
  - Display selected count
  - _Requirements: 8.4_

- [ ] 14.3 Connect bulk delete action
  - Wire Delete Selected to confirmation dialog
  - Show count in confirmation message
  - Call bulkDeleteHoldings on confirm
  - _Requirements: 8.5, 8.6_

- [ ] 14.4 Connect bulk export action
  - Wire Export Selected to export function
  - Filter CSV to include only selected holdings
  - _Requirements: 8.7_

- [ ] 14.5 Implement selection clearing
  - Clear selections after bulk actions complete
  - Clear selections on Clear button click
  - _Requirements: 8.8_

- [ ] 15. Frontend: Delete Confirmation Dialog
- [ ] 15.1 Create DeleteConfirmationDialog component
  - Build modal dialog with message
  - Add Confirm and Cancel buttons
  - Show holding details or count
  - _Requirements: 1.5, 8.5_

- [ ] 15.2 Integrate with delete operations
  - Connect to single holding delete
  - Connect to bulk delete
  - Handle loading state during deletion
  - _Requirements: 1.6, 8.6_

- [ ] 15.3 Style dialog consistently
  - Apply design system styles
  - Add warning color scheme
  - Make responsive
  - _Requirements: 6.1, 6.2_

- [ ] 16. Frontend: Skeleton Loaders
- [ ] 16.1 Create SkeletonSummaryBar component
  - Match PortfolioSummaryBar layout
  - Add shimmer animation
  - _Requirements: 9.1, 9.5_

- [ ] 16.2 Create SkeletonChart component
  - Match chart dimensions
  - Add shimmer animation
  - _Requirements: 9.1, 9.3_

- [ ] 16.3 Create SkeletonTableRow component
  - Match HoldingsTable row structure
  - Add shimmer animation
  - _Requirements: 9.1, 9.2_

- [ ] 16.4 Integrate skeletons into components
  - Use skeletons during initial load
  - Smooth transition to real content
  - _Requirements: 9.6_

- [ ] 17. Frontend: Enhanced Empty States
- [ ] 17.1 Create EmptyPortfolio component
  - Add illustration or icon
  - Add "Add Your First Holding" button
  - Add helpful explanatory text
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 17.2 Create EmptyFilterResults component
  - Add filter icon
  - Add message about adjusting filters
  - Add helpful text
  - _Requirements: 7.4, 7.5_

- [ ] 17.3 Integrate empty states into PortfolioPage
  - Show EmptyPortfolio when no holdings
  - Show EmptyFilterResults when filters return nothing
  - Wire button to open add modal
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 18. Frontend: Real-time price updates
- [ ] 18.1 Integrate useRealtime hook in PortfolioPage
  - Start polling on mount
  - Stop polling on unmount
  - Handle page visibility changes
  - _Requirements: 4.1, 4.4, 4.5_

- [ ] 18.2 Implement price update UI feedback
  - Highlight cells with price changes
  - Add brief animation on update
  - Update last update timestamp
  - _Requirements: 4.3, 4.7_

- [ ] 18.3 Handle price update errors gracefully
  - Implement retry logic
  - Don't show errors to user
  - Log errors for debugging
  - _Requirements: 4.6_

- [ ] 19. Frontend: Portfolio Page integration
- [ ] 19.1 Update PortfolioPage with new components
  - Add PerformanceChart and AssetAllocationChart
  - Add enhanced HoldingsTable with checkboxes and actions
  - Add PaginationControls
  - Add BulkActionsToolbar
  - _Requirements: 2.1, 3.1, 5.1, 8.1_

- [ ] 19.2 Integrate Add/Edit modal
  - Add AddEditHoldingModal to page
  - Add "Add Holding" button to header
  - Wire modal open/close logic
  - _Requirements: 1.1, 1.3_

- [ ] 19.3 Integrate delete confirmation
  - Add DeleteConfirmationDialog to page
  - Wire to delete actions
  - _Requirements: 1.5_

- [ ] 19.4 Connect all state management
  - Use useHoldings for holdings and CRUD
  - Use usePerformance for charts
  - Use useRealtime for price updates
  - Use usePagination for table pagination
  - _Requirements: 1.2, 1.4, 1.6, 2.1, 3.1, 4.1, 5.1_

- [ ] 20. Frontend: UI alignment and styling
- [ ] 20.1 Apply consistent spacing
  - Use spacing scale (16px, 24px, 32px) between sections
  - Ensure equal spacing in summary bar
  - Apply consistent padding to cards
  - _Requirements: 6.1, 6.3_

- [ ] 20.2 Apply consistent styling
  - Use 8px border radius on all cards
  - Apply consistent shadows
  - Use design system colors
  - _Requirements: 6.2, 6.7_

- [ ] 20.3 Standardize typography
  - Apply font scale consistently
  - Use correct font weights
  - Ensure readable line heights
  - _Requirements: 6.6_

- [ ] 20.4 Enhance interactive states
  - Add hover effects to buttons and rows
  - Add focus states for accessibility
  - Add active states for clicks
  - _Requirements: 6.8_

- [ ] 20.5 Align table columns properly
  - Right-align numeric columns
  - Left-align text columns
  - Center-align action columns
  - _Requirements: 6.9_

- [ ] 21. Frontend: Responsive design
- [ ] 21.1 Implement mobile chart layout
  - Stack charts vertically on mobile
  - Reduce chart heights
  - Ensure touch-friendly interactions
  - _Requirements: 10.1, 10.6_

- [ ] 21.2 Convert table to cards on mobile
  - Create HoldingCard component
  - Show cards instead of table on mobile
  - Add swipe-to-delete gesture
  - _Requirements: 10.2, 10.5_

- [ ] 21.3 Optimize mobile summary bar
  - Show only key metrics on mobile
  - Stack metrics vertically if needed
  - _Requirements: 10.3_

- [ ] 21.4 Make modals full-screen on mobile
  - Apply full-screen style to AddEditHoldingModal
  - Add slide-up animation
  - _Requirements: 10.4_

- [ ] 21.5 Ensure touch target sizes
  - Make all buttons at least 44px
  - Increase checkbox sizes on mobile
  - Add spacing between touch targets
  - _Requirements: 10.6_

- [ ] 22. Testing and validation
- [ ] 22.1 Test CRUD operations
  - Verify create holding works correctly
  - Verify edit holding updates data
  - Verify delete holding removes data
  - Verify bulk delete works
  - _Requirements: 1.2, 1.4, 1.6, 8.6_

- [ ] 22.2 Test duplicate handling
  - Create duplicate holding
  - Verify quantities merge
  - Verify average price calculation
  - _Requirements: 1.7_

- [ ] 22.3 Test form validation
  - Submit invalid data
  - Verify error messages appear
  - Verify submission blocked
  - _Requirements: 1.8_

- [ ] 22.4 Test pagination
  - Navigate through pages
  - Change page size
  - Verify correct data displayed
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 22.5 Test filtering with pagination
  - Apply filters
  - Verify pagination resets
  - Verify correct filtered data
  - _Requirements: 5.5_

- [ ] 22.6 Test selection and bulk actions
  - Select individual rows
  - Select all rows
  - Perform bulk delete
  - Perform bulk export
  - _Requirements: 8.2, 8.3, 8.6, 8.7_

- [ ] 22.7 Test charts
  - Verify performance chart renders
  - Change time ranges
  - Verify allocation chart renders
  - Click chart segments
  - _Requirements: 2.2, 2.3, 2.4, 3.5_

- [ ] 22.8 Test real-time updates
  - Verify polling starts
  - Verify prices update
  - Verify polling stops on unmount
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 22.9 Test responsive design
  - Test on mobile viewport
  - Test on tablet viewport
  - Test on desktop viewport
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
