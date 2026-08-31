import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { ConfigService } from '@nestjs/config';
import {
  User,
  UserRole,
  UserStatus,
  SellerProfile,
  ApprovalStatus,
  IdentificationType,
  Shop,
  ShopStatus,
  Category,
  CategoryStatus,
  Brand,
  BrandStatus,
  Product,
  ProductStatus,
  ProductVariant,
  ProductImage,
  ImageType,
  Coupon,
  CouponDiscountType,
  CouponStatus,
} from '../entities';

async function seedDatabase() {
  const configService = new ConfigService();
  const config = getDatabaseConfig(configService);

  const dataSource = new DataSource({
    ...config,
    synchronize: false,
    logging: true,
  } as any);

  try {
    await dataSource.initialize();
    console.log('🌱 Starting database seeding...\n');

    // 1. Create Users
    console.log('📝 Creating users...');
    const userRepo = dataSource.getRepository(User);
    
    const customer = userRepo.create({
      name: 'Ahmed Hassan',
      email: 'customer@vendora.com',
      password: '$2b$10$...hashed_password...', // Use bcrypt in production
      phone: '+92-300-1234567',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    const seller = userRepo.create({
      name: 'Fatima Khan',
      email: 'seller@vendora.com',
      password: '$2b$10$...hashed_password...',
      phone: '+92-301-9876543',
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
    });

    await userRepo.save([customer, seller]);
    console.log('✅ Users created\n');

    // 2. Create Seller Profile with KYC
    console.log('📋 Creating seller profile with KYC verification...');
    const sellerRepo = dataSource.getRepository(SellerProfile);

    const sellerProfile = sellerRepo.create({
      user_id: seller.id,
      shop_name: 'Fashion Boutique',
      slug: 'fashion-boutique',
      logo: 'https://example.com/logo.png',
      banner: 'https://example.com/banner.png',
      description: 'Premium fashion store with latest collections',
      identification_type: IdentificationType.CNIC,
      identification_number: '12345-6789012-3',
      identification_front: 'https://example.com/cnic-front.png',
      identification_back: 'https://example.com/cnic-back.png',
      phone: '+92-301-9876543',
      email: 'seller@vendora.com',
      approval_status: ApprovalStatus.APPROVED,
      commission_rate: 5,
      approved_at: new Date(),
    });

    await sellerRepo.save(sellerProfile);
    console.log('✅ Seller profile created with KYC verification\n');

    // 3. Create Shop
    console.log('🏪 Creating shop...');
    const shopRepo = dataSource.getRepository(Shop);

    const shop = shopRepo.create({
      seller_id: sellerProfile.id,
      name: 'Fashion Boutique Karachi',
      address: '123 Fashion Street, Karachi',
      country: 'Pakistan',
      city: 'Karachi',
      state: 'Sindh',
      postal_code: '75000',
      status: ShopStatus.ACTIVE,
      rating: 4.5,
      review_count: 145,
    });

    await shopRepo.save(shop);
    console.log('✅ Shop created\n');

    // 4. Create Categories
    console.log('📂 Creating categories...');
    const categoryRepo = dataSource.getRepository(Category);

    const fashionCategory = categoryRepo.create({
      name: 'Fashion',
      slug: 'fashion',
      image: 'https://example.com/fashion.png',
      description: 'Clothing and fashion items',
      status: CategoryStatus.ACTIVE,
      order: 1,
    });

    const menCategory = categoryRepo.create({
      name: 'Men',
      slug: 'men-fashion',
      image: 'https://example.com/men.png',
      description: 'Men clothing',
      status: CategoryStatus.ACTIVE,
      order: 1,
      parent_id: fashionCategory.id,
    });

    const womenCategory = categoryRepo.create({
      name: 'Women',
      slug: 'women-fashion',
      image: 'https://example.com/women.png',
      description: 'Women clothing',
      status: CategoryStatus.ACTIVE,
      order: 2,
      parent_id: fashionCategory.id,
    });

    await categoryRepo.save([fashionCategory]);
    menCategory.parent = fashionCategory;
    womenCategory.parent = fashionCategory;
    await categoryRepo.save([menCategory, womenCategory]);
    console.log('✅ Categories created\n');

    // 5. Create Brands
    console.log('🏷️  Creating brands...');
    const brandRepo = dataSource.getRepository(Brand);

    const nikeBrand = brandRepo.create({
      name: 'Nike',
      slug: 'nike',
      logo: 'https://example.com/nike-logo.png',
      description: 'Nike - Just Do It',
      status: BrandStatus.ACTIVE,
    });

    const adidasBrand = brandRepo.create({
      name: 'Adidas',
      slug: 'adidas',
      logo: 'https://example.com/adidas-logo.png',
      description: 'Adidas - Impossible is Nothing',
      status: BrandStatus.ACTIVE,
    });

    await brandRepo.save([nikeBrand, adidasBrand]);
    console.log('✅ Brands created\n');

    // 6. Create Products
    console.log('👕 Creating products...');
    const productRepo = dataSource.getRepository(Product);

    const nikeShirt = productRepo.create({
      seller_id: sellerProfile.id,
      shop_id: shop.id,
      category_id: menCategory.id,
      brand_id: nikeBrand.id,
      name: 'Nike Classic T-Shirt',
      slug: 'nike-classic-tshirt',
      description: 'Classic comfortable Nike T-Shirt for everyday wear',
      technical_details: 'Material: 100% Cotton, Care: Machine wash',
      price: 1500,
      discount_price: 1200,
      discount_percentage: 20,
      stock: 100,
      status: ProductStatus.ACTIVE,
      average_rating: 4.5,
      review_count: 42,
    });

    const adidasShoes = productRepo.create({
      seller_id: sellerProfile.id,
      shop_id: shop.id,
      category_id: menCategory.id,
      brand_id: adidasBrand.id,
      name: 'Adidas Sport Shoes',
      slug: 'adidas-sport-shoes',
      description: 'Professional sports shoes for running and training',
      technical_details: 'Material: Mesh and Rubber, Sole: EVA',
      price: 5000,
      discount_price: 4200,
      discount_percentage: 16,
      stock: 50,
      status: ProductStatus.ACTIVE,
      average_rating: 4.8,
      review_count: 78,
    });

    await productRepo.save([nikeShirt, adidasShoes]);
    console.log('✅ Products created\n');

    // 7. Create Product Variants
    console.log('🎨 Creating product variants...');
    const variantRepo = dataSource.getRepository(ProductVariant);

    const variants = [
      variantRepo.create({
        product_id: nikeShirt.id,
        color: 'Red',
        size: 'M',
        sku: 'NIKE-TS-RED-M',
        price: 1200,
        stock: 30,
      }),
      variantRepo.create({
        product_id: nikeShirt.id,
        color: 'Red',
        size: 'L',
        sku: 'NIKE-TS-RED-L',
        price: 1200,
        stock: 25,
      }),
      variantRepo.create({
        product_id: nikeShirt.id,
        color: 'Blue',
        size: 'M',
        sku: 'NIKE-TS-BLUE-M',
        price: 1200,
        stock: 25,
      }),
      variantRepo.create({
        product_id: adidasShoes.id,
        color: 'Black',
        size: '42',
        sku: 'ADIDAS-SS-BLACK-42',
        price: 4200,
        stock: 20,
      }),
      variantRepo.create({
        product_id: adidasShoes.id,
        color: 'White',
        size: '42',
        sku: 'ADIDAS-SS-WHITE-42',
        price: 4200,
        stock: 15,
      }),
    ];

    await variantRepo.save(variants);
    console.log('✅ Product variants created\n');

    // 8. Create Product Images
    console.log('🖼️  Creating product images...');
    const imageRepo = dataSource.getRepository(ProductImage);

    const images = [
      imageRepo.create({
        product_id: nikeShirt.id,
        url: 'https://example.com/nike-shirt-1.png',
        type: ImageType.FEATURED,
        order: 1,
      }),
      imageRepo.create({
        product_id: nikeShirt.id,
        url: 'https://example.com/nike-shirt-2.png',
        type: ImageType.GALLERY,
        order: 2,
      }),
      imageRepo.create({
        product_id: adidasShoes.id,
        url: 'https://example.com/adidas-shoes-1.png',
        type: ImageType.FEATURED,
        order: 1,
      }),
      imageRepo.create({
        product_id: adidasShoes.id,
        url: 'https://example.com/adidas-shoes-2.png',
        type: ImageType.GALLERY,
        order: 2,
      }),
    ];

    await imageRepo.save(images);
    console.log('✅ Product images created\n');

    // 9. Create Coupons
    console.log('🎟️  Creating coupons...');
    const couponRepo = dataSource.getRepository(Coupon);

    const coupons = [
      couponRepo.create({
        code: 'WELCOME20',
        description: 'Welcome discount for new customers',
        discount_type: CouponDiscountType.PERCENTAGE,
        discount_value: 20,
        maximum_discount: 500,
        minimum_purchase: 1000,
        usage_limit: 1000,
        usage_limit_per_customer: 1,
        status: CouponStatus.ACTIVE,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }),
      couponRepo.create({
        code: 'SUMMER500',
        description: 'Summer sale - flat 500 PKR off',
        discount_type: CouponDiscountType.FIXED,
        discount_value: 500,
        minimum_purchase: 2000,
        usage_limit: 500,
        status: CouponStatus.ACTIVE,
        start_date: new Date(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      }),
    ];

    await couponRepo.save(coupons);
    console.log('✅ Coupons created\n');

    console.log('✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - 2 Users created');
    console.log('  - 1 Seller Profile (with KYC)');
    console.log('  - 1 Shop');
    console.log('  - 3 Categories (1 parent, 2 children)');
    console.log('  - 2 Brands');
    console.log('  - 2 Products');
    console.log('  - 5 Product Variants');
    console.log('  - 4 Product Images');
    console.log('  - 2 Coupons');
    console.log('\n✅ Ready to test API endpoints!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedDatabase();
