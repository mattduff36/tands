import { Pool } from 'pg';
//import { log } from '@/lib/utils/logger';
import { performanceMonitor } from '@/lib/utils/performance-monitor';

// Create connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      
      // Connection pool sizing - optimized for Vercel/serverless environment
      max: isProduction ? 20 : 5, // Max connections: more in production, fewer in dev
      min: isProduction ? 2 : 1, // Min connections: keep some warm connections in production
      
      // Timeouts - more generous for production reliability
      idleTimeoutMillis: isProduction ? 60000 : 30000, // Keep idle connections longer in production
      connectionTimeoutMillis: isProduction ? 5000 : 2000, // More time to establish connections in production
      
      // Query and statement timeouts to prevent hanging
      statement_timeout: 30000, // 30 seconds max per statement
      query_timeout: 25000, // 25 seconds max per query (shorter than statement_timeout)
      
      // Connection validation and recovery
      application_name: 'taylors-smiths-booking-system',
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // 10 seconds before first keep-alive
    });
    
    // Enhanced error handling with connection pool monitoring
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      if (pool) {
        console.error('Pool stats:', {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        });
      }
      
      // Don't exit process in production - let it recover
      if (!isProduction) {
        process.exit(-1);
      }
    });
    
    // Log pool creation in development
    if (!isProduction) {
      console.log('Database pool created with optimized settings:', {
        max: pool.options.max,
        min: pool.options.min,
        idleTimeoutMillis: pool.options.idleTimeoutMillis,
        connectionTimeoutMillis: pool.options.connectionTimeoutMillis
      });
    }
  }
  
  return pool;
}

/**
 * Get database pool statistics for monitoring
 */
export function getPoolStats() {
  const currentPool = getPool();
  return {
    totalCount: currentPool.totalCount,
    idleCount: currentPool.idleCount,
    waitingCount: currentPool.waitingCount,
    maxConnections: currentPool.options.max,
    minConnections: currentPool.options.min,
  };
}

/**
 * Execute a SQL query with parameters
 */
export async function query(text: string, params: any[] = []) {
  const pool = getPool();
  const queryType = text.trim().split(' ')[0].toUpperCase();
  const timer = performanceMonitor.startTimer(`db_query_${queryType}`, {
    queryLength: text.length,
    paramCount: params.length,
    queryPreview: text.substring(0, 50)
  });
  
  try {
    const res = await pool.query(text, params);
    const duration = timer.end();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('query', duration, { 
        rows: res.rowCount,
        poolStats: getPoolStats()
      });
    }
    
    // Log slow queries in production for monitoring
    if (process.env.NODE_ENV === 'production' && duration > 5000) {
      console.warn('Slow query detected', {
        duration: `${duration}ms`,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        poolStats: getPoolStats()
      });
    }
    
    return res;
  } catch (error) {
    timer.end();
    console.error('Database query error', {
      error: error instanceof Error ? error.message : String(error),
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      poolStats: getPoolStats()
    });
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const queryInTransaction = (text: string, params: any[] = []) => {
      return client.query(text, params);
    };
    
    const result = await callback(queryInTransaction);
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initialize database tables
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database tables');
    
    // Create castles table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS castles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        theme VARCHAR(100) NOT NULL,
        size VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        maintenance_status VARCHAR(20) DEFAULT 'available',
        maintenance_notes TEXT,
        maintenance_start_date DATE,
        maintenance_end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add maintenance columns to existing castles table if they don't exist
    try {
      await query(`
        ALTER TABLE castles 
        ADD COLUMN IF NOT EXISTS maintenance_status VARCHAR(20) DEFAULT 'available'
      `);
      await query(`
        ALTER TABLE castles 
        ADD COLUMN IF NOT EXISTS maintenance_notes TEXT
      `);
      await query(`
        ALTER TABLE castles 
        ADD COLUMN IF NOT EXISTS maintenance_start_date DATE
      `);
      await query(`
        ALTER TABLE castles 
        ADD COLUMN IF NOT EXISTS maintenance_end_date DATE
      `);
      console.log('Maintenance fields added to castles table');
    } catch (error) {
      console.log('Maintenance fields already exist or error adding them', { error: error instanceof Error ? error.message : String(error) });
    }

    // Add performance index for frequently queried maintenance status
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_castles_maintenance_status 
        ON castles (maintenance_status)
      `);
      console.log('Maintenance status index added to castles table');
    } catch (error) {
      console.log('Maintenance status index already exists or error adding it', { error: error instanceof Error ? error.message : String(error) });
    }

    // Create bookings table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_ref VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        castle_id INTEGER NOT NULL,
        castle_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        total_price INTEGER NOT NULL,
        deposit INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add agreement columns to bookings table if they don't exist
    try {
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS agreement_signed BOOLEAN DEFAULT FALSE
      `);
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMP WITH TIME ZONE
      `);
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS agreement_signed_by VARCHAR(255)
      `);
      console.log('Agreement fields added to bookings table');
    } catch (error) {
      console.log('Agreement fields already exist or error adding them', { error: error instanceof Error ? error.message : String(error) });
    }
    
    // Check if we have any data
    const result = await query('SELECT COUNT(*) FROM castles');
    const count = parseInt(result.rows[0].count);
    
    // Insert default data if table is empty
    if (count === 0) {
      console.log('Inserting default castle data');
      
      const defaultCastles = [
        {
          name: "The Classic Fun",
          theme: "Classic",
          size: "12ft x 15ft",
          price: 60,
          description: "A timeless classic, perfect for any party or event. Bright, colorful, and guaranteed to bring smiles.",
          image_url: "/bouncy-castle-1.jpg",
        },
        {
          name: "Princess Palace",
          theme: "Princess",
          size: "15ft x 15ft",
          price: 75,
          description: "A magical castle for your little princess. Features beautiful artwork of enchanting characters.",
          image_url: "/bouncy-castle-2.jpg",
        },
        {
          name: "Jungle Adventure",
          theme: "Jungle",
          size: "12ft x 18ft with slide",
          price: 80,
          description: "Go on a wild adventure! This castle includes a fun slide and is decorated with jungle animals.",
          image_url: "/bouncy-castle-3.jpg",
        },
        {
          name: "Superhero Base",
          theme: "Superhero",
          size: "14ft x 14ft",
          price: 70,
          description: "Become a superhero for a day! This castle is perfect for action-packed parties.",
          image_url: "/bouncy-castle-4.jpg",
        },
        {
          name: "Party Time Bouncer",
          theme: "Party",
          size: "10ft x 12ft",
          price: 55,
          description: "Ideal for smaller gardens, this compact bouncer is all about celebrating in style.",
          image_url: "/bouncy-castle-1.jpg",
        },
        {
          name: "Under The Sea",
          theme: "Ocean",
          size: "15ft x 16ft",
          price: 75,
          description: "Dive into fun with our ocean-themed bouncy castle, complete with colorful sea creatures.",
          image_url: "/bouncy-castle-2.jpg",
        },
      ];
      
      for (const castle of defaultCastles) {
        await query(
          `INSERT INTO castles (name, theme, size, price, description, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [castle.name, castle.theme, castle.size, castle.price, castle.description, castle.image_url]
        );
      }
      
      console.log('Default castle data inserted successfully');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Export pool for use in other modules
export { getPool };

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const result = await query('SELECT 1 as test');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Close all database connections
 */
export async function closeConnections() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connections closed');
  }
}