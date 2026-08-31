import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { SellersService } from '../sellers/sellers.service';
import { ProductWarehouseService } from '../product-warehouse/product-warehouse.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly sellersService: SellersService,
    private readonly paymentsService: PaymentsService,
    private readonly productWarehouseService: ProductWarehouseService,
  ) {}

  async getDashboard() {
    const sellers = this.sellersService.findAll();
    const products = (await this.productWarehouseService.listWarehouse({ page: 1, limit: 100, includeInactive: true })).items;
    const orders = this.sellersService.getAllOrders();
    const customers = new Set(orders.map((order) => order.customerName));
    return {
      totalSales: sellers.reduce((sum, seller) => sum + Number(seller.earnings || 0), 0),
      totalOrders: orders.length,
      totalCustomers: customers.size,
      totalSellers: sellers.length,
      totalProducts: products.length,
      salesOverview: [],
      orderOverview: [],
      recentOrders: orders.slice(-5).map((order) => ({
        id: order.id,
        customer: order.customerName,
        total: order.total,
        status: order.status,
      })),
      topProducts: products.slice(0, 5).map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        sales: 120 + product.id,
      })),
      recentSellers: sellers.map((seller) => ({
        id: seller.id,
        shopName: seller.shopName,
        status: seller.status,
        sales: seller.earnings || 0,
        registeredAt: new Date().toISOString(),
      })),
      pendingApprovals: this.sellersService.getApplications().length,
    };
  }

  getSellers() {
    return this.sellersService.findAll();
  }

  getPendingSellers() {
    return this.sellersService.findAll().filter((seller) => String(seller.status).toLowerCase() === 'pending');
  }

  getSellerById(id: number) {
    return this.sellersService.findOne(id);
  }

  approveSeller(id: number) {
    return this.sellersService.approveSeller(id);
  }

  rejectSeller(id: number) {
    return this.sellersService.rejectSeller(id);
  }

  async getProducts() {
    return (await this.productWarehouseService.listWarehouse({ page: 1, limit: 100, includeInactive: true })).items;
  }

  approveProduct(id: string) {
    return this.productWarehouseService.updateWarehouseProduct(id, { status: 'PUBLISHED' });
  }

  rejectProduct(id: string) {
    return this.productWarehouseService.updateWarehouseProduct(id, { status: 'REJECTED' });
  }

  updateProductStatus(id: string, status: string) {
    return this.productWarehouseService.updateWarehouseProduct(id, { status });
  }

  deleteProduct(id: string) {
    return this.productWarehouseService.deleteWarehouseProduct(id);
  }

  getSellerApplications() {
    return this.sellersService.getApplications();
  }

  getCommissionOverview() {
    const sellers = this.sellersService.findAll();
    const sellerSummary = sellers.map((seller) => ({
      id: seller.id,
      shopName: seller.shopName,
      status: seller.status,
      commissionRate: seller.commissionRate || 10,
      earnings: seller.earnings || 0,
      withdrawableBalance: seller.withdrawableBalance || 0,
    }));

    const totalRevenue = sellers.reduce((sum, seller) => sum + Number(seller.earnings || 0), 0);
    const totalCommission = sellers.reduce(
      (sum, seller) => sum + Number((seller.earnings || 0) * ((seller.commissionRate || 10) / 100)),
      0,
    );
    const pendingPayouts = this.paymentsService.getPayouts().filter((payout) => payout.status === 'pending');

    return {
      totalSellers: sellers.length,
      activeSellers: sellers.filter((seller) => seller.status === 'active').length,
      totalRevenue,
      totalCommission,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutAmount: pendingPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0),
      sellers: sellerSummary,
    };
  }

  approveSellerApplication(applicationId: string) {
    return this.sellersService.approveApplication(applicationId);
  }

  rejectSellerApplication(applicationId: string) {
    return this.sellersService.rejectApplication(applicationId);
  }

  setSellerCommission(sellerId: number, commissionRate: number) {
    const seller = this.sellersService.findOne(sellerId);
    if (!seller) {
      throw new BadRequestException('Seller not found.');
    }

    const rate = Number(commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      throw new BadRequestException('Commission rate must be a number between 0 and 100.');
    }

    seller.commissionRate = rate;
    return {
      message: 'Seller commission updated successfully.',
      seller,
    };
  }

  getPayoutQueue() {
    return this.paymentsService.getPayouts();
  }

  approvePayout(payoutId: number) {
    return this.paymentsService.processPayout(payoutId);
  }
}
