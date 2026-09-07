import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private parseDate(dateStr?: string): Date | null {
    return dateStr ? new Date(dateStr) : null;
  }

  private buildDateFilter(from?: string, to?: string) {
    const filters: any = {};
    if (from) filters.gte = this.parseDate(from);
    if (to) {
      const toDate = this.parseDate(to);
      if (toDate) toDate.setHours(23, 59, 59, 999);
      filters.lte = toDate;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  async getSalesReport(from?: string, to?: string, sellerId?: string, categoryId?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: any = {
      status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] },
    };

    if (dateFilter) where.createdAt = dateFilter;
    if (sellerId) where.items = { some: { sellerId } };

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true, payment: true },
    });

    const salesByDay: Record<string, number> = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach((order) => {
      totalOrders++;
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const dayRevenue = Number(order.total) || 0;
      salesByDay[date] = (salesByDay[date] || 0) + dayRevenue;
      totalRevenue += dayRevenue;

      order.items.forEach((item) => {
        if (!categoryId || item.warehouseProductId === categoryId) {
          const key = item.warehouseProductId || item.productId;
          if (!productSales[key]) {
            productSales[key] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productSales[key].quantity += item.quantity;
          productSales[key].revenue += Number(item.price || 0) * item.quantity;
        }
      });
    });

    return {
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        period: { from, to },
      },
      chartData: Object.entries(salesByDay).map(([date, revenue]) => ({ date, revenue })),
      topProducts: Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([id, data]) => ({ id, ...data })),
    };
  }

  async getOrdersReport(from?: string, to?: string, sellerId?: string, categoryId?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: any = {};

    if (dateFilter) where.createdAt = dateFilter;
    if (sellerId) where.items = { some: { sellerId } };

    const orders = await this.prisma.order.findMany({
      where,
      include: { user: true, items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });

    const statusCounts: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};

    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      ordersByDay[date] = (ordersByDay[date] || 0) + 1;
    });

    return {
      summary: {
        totalOrders: orders.length,
        completedOrders: statusCounts['COMPLETED'] || 0,
        pendingOrders: statusCounts['PENDING'] || 0,
        cancelledOrders: statusCounts['CANCELLED'] || 0,
        period: { from, to },
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      chartData: Object.entries(ordersByDay).map(([date, count]) => ({ date, count })),
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.id,
        customer: o.user.name,
        email: o.user.email,
        total: Number(o.total),
        status: o.status,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
    };
  }

  async getProductsReport(from?: string, to?: string, categoryId?: string) {
    const where: any = {};
    const dateFilter = this.buildDateFilter(from, to);

    if (categoryId) where.category = categoryId;

    const products = await this.prisma.warehouseProduct.findMany({
      where,
    });

    const orderItems = await this.prisma.orderItem.findMany({
      where: dateFilter ? { order: { createdAt: dateFilter } } : undefined,
    });

    const productMetrics: Record<
      string,
      { name: string; sku: string; category: string; stock: number; sold: number; revenue: number }
    > = {};

    products.forEach((p) => {
      productMetrics[p.id] = {
        name: p.name,
        sku: p.sku,
        category: p.category || 'Uncategorized',
        stock: p.stock,
        sold: 0,
        revenue: 0,
      };
    });

    orderItems.forEach((item) => {
      if (productMetrics[item.productId]) {
        productMetrics[item.productId].sold += item.quantity;
        productMetrics[item.productId].revenue += Number(item.price || 0) * item.quantity;
      }
    });

    const productList = Object.entries(productMetrics)
      .map(([id, metrics]) => ({ id, ...metrics }))
      .sort((a, b) => b.sold - a.sold);

    return {
      summary: {
        totalProducts: products.length,
        lowStockProducts: products.filter((p) => p.stock <= 10).length,
        outOfStockProducts: products.filter((p) => p.stock === 0).length,
        period: { from, to },
      },
      chartData: [
        { name: 'In Stock', value: products.filter((p) => p.stock > 10).length },
        { name: 'Low Stock', value: products.filter((p) => p.stock <= 10 && p.stock > 0).length },
        { name: 'Out of Stock', value: products.filter((p) => p.stock === 0).length },
      ],
      products: productList.slice(0, 100),
    };
  }

  async getSellersReport(from?: string, to?: string, categoryId?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const sellers = await this.prisma.seller.findMany({
      include: { user: true, shop: true },
    });

    const sellerMetrics: Record<
      string,
      { name: string; shop: string; email: string; status: string; orderCount: number; revenue: number }
    > = {};

    sellers.forEach((seller) => {
      sellerMetrics[seller.id] = {
        name: seller.user.name,
        shop: seller.shop?.name || 'Unnamed',
        email: seller.user.email,
        status: seller.status,
        orderCount: 0,
        revenue: 0,
      };
    });

    const orders = await this.prisma.order.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      include: { items: true },
    });

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.sellerId && sellerMetrics[item.sellerId]) {
          sellerMetrics[item.sellerId].orderCount++;
          sellerMetrics[item.sellerId].revenue += Number(item.price || 0) * item.quantity;
        }
      });
    });

    return {
      summary: {
        totalSellers: sellers.length,
        activeSellers: sellers.filter((s) => s.status === 'VERIFIED').length,
        totalSellerRevenue: Object.values(sellerMetrics).reduce((sum, s) => sum + s.revenue, 0),
        period: { from, to },
      },
      chartData: Object.entries(sellerMetrics)
        .map(([id, metrics]) => ({ name: metrics.shop, revenue: metrics.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      sellers: Object.entries(sellerMetrics)
        .map(([id, metrics]) => ({ id, ...metrics }))
        .sort((a, b) => b.revenue - a.revenue),
    };
  }

  async getCustomersReport(from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const customers = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER', deletedAt: null },
      include: { orders: { where: dateFilter ? { createdAt: dateFilter } : undefined } },
    });

    const customerMetrics: Record<
      string,
      { name: string; email: string; phone: string; orderCount: number; totalSpent: number; lastOrder: Date | null }
    > = {};

    customers.forEach((customer) => {
      let totalSpent = 0;
      let lastOrder: Date | null = null;

      customer.orders.forEach((order) => {
        totalSpent += Number(order.total) || 0;
        if (!lastOrder || order.createdAt > lastOrder) lastOrder = order.createdAt;
      });

      customerMetrics[customer.id] = {
        name: customer.name,
        email: customer.email,
        phone: 'N/A',
        orderCount: customer.orders.length,
        totalSpent,
        lastOrder,
      };
    });

    return {
      summary: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c) => c.orders.length > 0).length,
        totalCustomerRevenue: Object.values(customerMetrics).reduce((sum, c) => sum + c.totalSpent, 0),
        averageOrderValue:
          Object.values(customerMetrics).reduce((sum, c) => sum + c.totalSpent, 0) /
          (Object.values(customerMetrics).filter((c) => c.orderCount > 0).length || 1),
        period: { from, to },
      },
      chartData: [
        {
          name: 'Single Purchase',
          value: Object.values(customerMetrics).filter((c) => c.orderCount === 1).length,
        },
        {
          name: '2-5 Purchases',
          value: Object.values(customerMetrics).filter((c) => c.orderCount >= 2 && c.orderCount <= 5).length,
        },
        {
          name: '6+ Purchases',
          value: Object.values(customerMetrics).filter((c) => c.orderCount >= 6).length,
        },
      ],
      customers: Object.entries(customerMetrics)
        .map(([id, metrics]) => ({ id, ...metrics }))
        .sort((a, b) => b.totalSpent - a.totalSpent),
    };
  }

  async getFinancialReport(from?: string, to?: string, sellerId?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: any = { status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] } };

    if (dateFilter) where.createdAt = dateFilter;
    if (sellerId) where.items = { some: { sellerId } };

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true, payment: true },
    });

    let grossRevenue = 0;
    let vendoraCommission = 0;
    let sellerEarnings = 0;
    let paymentFees = 0;

    orders.forEach((order) => {
      const total = Number(order.total) || 0;
      grossRevenue += total;

      order.items.forEach((item) => {
        const itemTotal = Number(item.price || 0) * item.quantity;
        const commission = itemTotal * 0.15; // 15% commission
        vendoraCommission += commission;
        sellerEarnings += itemTotal - commission;
      });

      if (order.payment) {
        const fee = total * 0.025; // 2.5% payment fee
        paymentFees += fee;
      }
    });

    const netRevenue = grossRevenue - paymentFees;

    return {
      summary: {
        grossRevenue,
        vendoraCommission,
        sellerEarnings,
        paymentFees,
        netRevenue,
        totalOrders: orders.length,
        period: { from, to },
      },
      breakdown: [
        { label: 'Gross Revenue', value: grossRevenue },
        { label: 'Vendora Commission', value: vendoraCommission },
        { label: 'Payment Fees', value: paymentFees },
        { label: 'Net Revenue', value: netRevenue },
      ],
    };
  }

  async getRefundsReport(from?: string, to?: string, sellerId?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: any = {};

    if (dateFilter) where.requestedAt = dateFilter;
    if (sellerId) where.order = { items: { some: { sellerId } } };

    const refunds = await this.prisma.refundRequest.findMany({
      where,
      include: { order: { include: { items: true } }, customer: true, seller: { include: { user: true } } },
      orderBy: { requestedAt: 'desc' },
    });

    let totalRefundAmount = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    const statusCounts: Record<string, number> = {};
    const reasonCounts: Record<string, number> = {};

    refunds.forEach((refund) => {
      const amount = Number(refund.amount) || 0;
      totalRefundAmount += amount;
      statusCounts[refund.status] = (statusCounts[refund.status] || 0) + 1;
      reasonCounts[refund.reason] = (reasonCounts[refund.reason] || 0) + 1;

      if (refund.status === 'APPROVED') approvedAmount += amount;
      if (refund.status === 'REQUESTED') pendingAmount += amount;
    });

    return {
      summary: {
        totalRefunds: refunds.length,
        totalRefundAmount,
        approvedAmount,
        pendingAmount,
        approvalRate: refunds.length > 0 ? ((statusCounts['APPROVED'] || 0) / refunds.length) * 100 : 0,
        period: { from, to },
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      reasonDistribution: Object.entries(reasonCounts).map(([reason, count]) => ({ reason, count })),
      refunds: refunds.map((r) => ({
        id: r.id,
        orderId: r.order.id,
        customer: r.customer.name,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        requestedAt: r.requestedAt,
      })),
    };
  }

  async getWithdrawalsReport(from?: string, to?: string, sellerId?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: any = {};

    if (dateFilter) where.createdAt = dateFilter;
    if (sellerId) where.seller = { id: sellerId };

    const payouts = await this.prisma.withdrawal.findMany({
      where,
      include: { seller: { include: { user: true, shop: true } } },
      orderBy: { requestedAt: 'desc' },
    });

    let totalWithdrawals = 0;
    let processedAmount = 0;
    let pendingAmount = 0;
    const statusCounts: Record<string, number> = {};

    payouts.forEach((payout) => {
      const amount = Number(payout.amount) || 0;
      totalWithdrawals += amount;
      statusCounts[payout.status] = (statusCounts[payout.status] || 0) + 1;

      if (payout.status === 'COMPLETED') processedAmount += amount;
      if (payout.status === 'PENDING') pendingAmount += amount;
    });

    return {
      summary: {
        totalWithdrawals: payouts.length,
        totalWithdrawalAmount: totalWithdrawals,
        processedAmount,
        pendingAmount,
        averageWithdrawal: payouts.length > 0 ? totalWithdrawals / payouts.length : 0,
        period: { from, to },
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      chartData: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      payouts: payouts.map((p) => ({
        id: p.id,
        seller: p.seller.user.name,
        shop: p.seller.shop?.name || 'Unnamed',
        amount: Number(p.amount),
        status: p.status,
        createdAt: p.requestedAt,
      })),
    };
  }

  async getCommissionReport(from?: string, to?: string, sellerId?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: any = { status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] } };

    if (dateFilter) where.createdAt = dateFilter;
    if (sellerId) where.items = { some: { sellerId } };

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true },
    });

    const sellers = await this.prisma.seller.findMany({ include: { user: true, shop: true } });
    const sellerLookup = new Map(sellers.map((seller) => [seller.id, seller]));

    const sellerCommissions: Record<
      string,
      { seller: string; shop: string; gmv: number; commission: number; earnings: number }
    > = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.sellerId;
        if (!key) return;
        const seller = sellerLookup.get(key);
        if (!seller) return;
        const itemTotal = Number(item.price || 0) * item.quantity;
        const commission = itemTotal * 0.15; // 15% marketplace commission

        if (!sellerCommissions[key]) {
          sellerCommissions[key] = {
            seller: seller.user.name,
            shop: seller.shop?.name || 'Unnamed',
            gmv: 0,
            commission: 0,
            earnings: 0,
          };
        }

        sellerCommissions[key].gmv += itemTotal;
        sellerCommissions[key].commission += commission;
        sellerCommissions[key].earnings += itemTotal - commission;
      });
    });

    const totalGMV = Object.values(sellerCommissions).reduce((sum, s) => sum + s.gmv, 0);
    const totalCommission = Object.values(sellerCommissions).reduce((sum, s) => sum + s.commission, 0);

    return {
      summary: {
        totalGMV,
        totalCommission,
        totalSellerEarnings: totalGMV - totalCommission,
        averageCommissionRate: totalGMV > 0 ? (totalCommission / totalGMV) * 100 : 0,
        period: { from, to },
      },
      chartData: Object.entries(sellerCommissions)
        .map(([id, data]) => ({ seller: data.shop, gmv: data.gmv }))
        .sort((a, b) => b.gmv - a.gmv)
        .slice(0, 10),
      commissions: Object.entries(sellerCommissions)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.gmv - a.gmv),
    };
  }
}

