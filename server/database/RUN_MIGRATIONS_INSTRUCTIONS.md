# Portfolio Enhancements Migrations

## New Migration Files Created

1. `004_create_portfolio_snapshots_table.sql` - Creates portfolio_snapshots table for performance tracking
2. `005_create_price_history_table.sql` - Creates price_history table for price tracking
3. `006_enhance_holdings_table.sql` - Adds account and notes columns to holdings table

## How to Run Migrations

### Option 1: Run All Migrations (Recommended)
```bash
cd server/database
node setupAllTables.js
```

This will run ALL migrations in order, including the new ones.

### Option 2: Run Individual Migrations
If you prefer to run migrations individually:

```bash
cd server
psql -U postgres -d tradex_auth -f database/migrations/004_create_portfolio_snapshots_table.sql
psql -U postgres -d tradex_auth -f database/migrations/005_create_price_history_table.sql
psql -U postgres -d tradex_auth -f database/migrations/006_enhance_holdings_table.sql
```

### Option 3: Using Node Script
```bash
cd server/database
node runPortfolioMigrations.js
```

## Verify Migrations

After running migrations, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('portfolio_snapshots', 'price_history', 'holdings')
ORDER BY table_name;

-- Check holdings table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'holdings'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('portfolio_snapshots', 'price_history', 'holdings')
ORDER BY tablename, indexname;
```

## Troubleshooting

If you encounter database connection errors:

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   pg_ctl status -D "C:\Program Files\PostgreSQL\<version>\data"
   
   # Or check services
   services.msc
   # Look for "postgresql-x64-<version>"
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -l
   ```

3. **Check .env file:**
   - Ensure DB_PASSWORD is correct
   - Ensure DB_NAME matches your database
   - Ensure DB_USER has permissions

4. **Test connection:**
   ```bash
   psql -U postgres -d tradex_auth
   ```

## What These Migrations Do

### portfolio_snapshots Table
- Stores daily snapshots of portfolio performance
- Used for performance charts showing value over time
- Includes total value, invested amount, profit/loss
- One snapshot per user per day

### price_history Table
- Stores historical price data for all assets
- Used for price tracking and charts
- Includes symbol, asset type, price, timestamp
- Enables real-time price updates

### holdings Table Enhancements
- Adds `account` column (VARCHAR(100)) - Store which account holds the asset
- Adds `notes` column (TEXT) - User notes about the holding
- Adds indexes for better pagination performance
- Adds indexes for duplicate detection

## Next Steps

After migrations are complete, you can proceed with:
1. Backend CRUD operations implementation
2. Performance service implementation
3. Price update service implementation
