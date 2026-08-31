import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1693526400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM('customer', 'seller', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE user_status_enum AS ENUM('active', 'inactive', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE approval_status_enum AS ENUM('pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE identification_type_enum AS ENUM('cnic', 'driving_license', 'passport')
    `);
    await queryRunner.query(`
      CREATE TYPE shop_status_enum AS ENUM('active', 'inactive', 'closed')
    `);
    await queryRunner.query(`
      CREATE TYPE category_status_enum AS ENUM('active', 'inactive')
    `);
    await queryRunner.query(`
      CREATE TYPE brand_status_enum AS ENUM('active', 'inactive')
    `);
    await queryRunner.query(`
      CREATE TYPE product_status_enum AS ENUM('active', 'inactive', 'out_of_stock')
    `);
    await queryRunner.query(`
      CREATE TYPE image_type_enum AS ENUM('thumbnail', 'featured', 'gallery')
    `);
    await queryRunner.query(`
      CREATE TYPE order_status_enum AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE payment_status_enum AS ENUM('pending', 'completed', 'failed', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE payment_gateway_enum AS ENUM('stripe', 'paypal', 'bank_transfer', 'cod')
    `);
    await queryRunner.query(`
      CREATE TYPE payment_transaction_status_enum AS ENUM('pending', 'authorized', 'captured', 'failed', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE transaction_type_enum AS ENUM('sale', 'commission', 'withdrawal', 'refund', 'adjustment', 'payout')
    `);
    await queryRunner.query(`
      CREATE TYPE transaction_status_enum AS ENUM('pending', 'completed', 'failed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE review_status_enum AS ENUM('pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE coupon_discount_type_enum AS ENUM('percentage', 'fixed')
    `);
    await queryRunner.query(`
      CREATE TYPE coupon_status_enum AS ENUM('active', 'inactive', 'expired')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar TEXT,
        role user_role_enum DEFAULT 'customer',
        status user_status_enum DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create seller_profiles table
    await queryRunner.query(`
      CREATE TABLE seller_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        shop_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        logo TEXT,
        banner TEXT,
        description TEXT,
        identification_type identification_type_enum NOT NULL,
        identification_number VARCHAR(255) NOT NULL,
        identification_front TEXT NOT NULL,
        identification_back TEXT,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        approval_status approval_status_enum DEFAULT 'pending',
        commission_rate FLOAT DEFAULT 0,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP
      )
    `);

    // Create shops table
    await queryRunner.query(`
      CREATE TABLE shops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        country VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        rating FLOAT DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        status shop_status_enum DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        image TEXT,
        description TEXT,
        status category_status_enum DEFAULT 'active',
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create brands table
    await queryRunner.query(`
      CREATE TABLE brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        logo TEXT,
        description TEXT,
        status brand_status_enum DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
        shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
        category_id UUID NOT NULL REFERENCES categories(id),
        brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        technical_details TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount_price DECIMAL(10, 2),
        discount_percentage INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        sold_count INTEGER DEFAULT 0,
        average_rating FLOAT DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        status product_status_enum DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create product_variants table
    await queryRunner.query(`
      CREATE TABLE product_variants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        color VARCHAR(50),
        size VARCHAR(50),
        sku VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create product_images table
    await queryRunner.query(`
      CREATE TABLE product_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type image_type_enum DEFAULT 'gallery',
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id UUID NOT NULL REFERENCES users(id),
        seller_id UUID NOT NULL REFERENCES seller_profiles(id),
        subtotal DECIMAL(12, 2) NOT NULL,
        tax DECIMAL(12, 2) DEFAULT 0,
        shipping_cost DECIMAL(12, 2) DEFAULT 0,
        discount_amount DECIMAL(12, 2) DEFAULT 0,
        total_amount DECIMAL(12, 2) NOT NULL,
        payment_status payment_status_enum DEFAULT 'pending',
        order_status order_status_enum DEFAULT 'pending',
        shipping_address TEXT,
        billing_address TEXT,
        tracking_number VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shipped_at TIMESTAMP,
        delivered_at TIMESTAMP
      )
    `);

    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(12, 2) NOT NULL,
        variant_color VARCHAR(50),
        variant_size VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
        gateway payment_gateway_enum DEFAULT 'stripe',
        transaction_id VARCHAR(255),
        amount DECIMAL(12, 2) NOT NULL,
        status payment_transaction_status_enum DEFAULT 'pending',
        response_data TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP
      )
    `);

    // Create seller_wallets table
    await queryRunner.query(`
      CREATE TABLE seller_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID NOT NULL UNIQUE REFERENCES seller_profiles(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) DEFAULT 0,
        total_earnings DECIMAL(15, 2) DEFAULT 0,
        total_withdrawn DECIMAL(15, 2) DEFAULT 0,
        pending_balance DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wallet_transactions table
    await queryRunner.query(`
      CREATE TABLE wallet_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID NOT NULL REFERENCES seller_wallets(seller_id),
        type transaction_type_enum NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        status transaction_status_enum DEFAULT 'pending',
        description TEXT,
        reference_id VARCHAR(255),
        reference_order_id UUID,
        balance_before DECIMAL(15, 2),
        balance_after DECIMAL(15, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      )
    `);

    // Create reviews table
    await queryRunner.query(`
      CREATE TABLE reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id),
        customer_id UUID NOT NULL REFERENCES users(id),
        rating INTEGER DEFAULT 5,
        title VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        status review_status_enum DEFAULT 'pending',
        helpful_count INTEGER DEFAULT 0,
        verified_purchase BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create coupons table
    await queryRunner.query(`
      CREATE TABLE coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        discount_type coupon_discount_type_enum DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        maximum_discount DECIMAL(10, 2),
        minimum_purchase DECIMAL(10, 2) DEFAULT 0,
        usage_limit INTEGER,
        usage_count INTEGER DEFAULT 0,
        usage_limit_per_customer INTEGER,
        status coupon_status_enum DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX idx_user_email ON users(email)`);
    await queryRunner.query(
      `CREATE INDEX idx_seller_user_id ON seller_profiles(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_product_seller_id ON products(seller_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_product_category_id ON products(category_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_product_slug ON products(slug)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_customer_id ON orders(customer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_seller_id ON orders(seller_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_status ON orders(order_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_payment_status ON orders(payment_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wallet_seller_id ON seller_wallets(seller_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wallet_transaction_seller_id ON wallet_transactions(seller_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_review_product_id ON reviews(product_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_coupon_code ON coupons(code)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_coupon_code`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_review_product_id`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_wallet_transaction_seller_id`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wallet_seller_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_payment_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_seller_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_customer_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_product_slug`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_product_category_id`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_product_seller_id`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_seller_user_id`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_email`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS coupons`);
    await queryRunner.query(`DROP TABLE IF EXISTS reviews`);
    await queryRunner.query(`DROP TABLE IF EXISTS wallet_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS seller_wallets`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_images`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_variants`);
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
    await queryRunner.query(`DROP TABLE IF EXISTS brands`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS shops`);
    await queryRunner.query(`DROP TABLE IF EXISTS seller_profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS coupon_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS coupon_discount_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS review_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS transaction_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS transaction_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_transaction_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_gateway_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS image_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS product_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS brand_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS category_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS shop_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS identification_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS approval_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum`);
  }
}
