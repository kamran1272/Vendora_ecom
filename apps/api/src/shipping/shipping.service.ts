import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateShippingCost(weight: number, distance: number) {
    const rules = await (this.prisma as any).commerceConfig.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default' } });
    const baseCost = Number(rules.shippingPerSeller);
    const weightCost = Math.max(0, Number(weight || 0)) * 0.5;
    const distanceCost = Math.max(0, Number(distance || 0)) / 100 * 2;
    return baseCost + weightCost + distanceCost;
  }

  async createShipment(shipmentData: any) {
    const orderId = shipmentData?.orderId ? String(shipmentData.orderId) : null;

    if (!orderId) {
      throw new Error('Order ID is required to create shipment.');
    }
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId: String(shipmentData.userId) } });
    if (!order) throw new Error('Order not found for this customer.');

    return this.prisma.shipment.upsert({
      where: { orderId },
      update: {
        carrier: shipmentData?.carrier || null,
        trackingNumber: shipmentData?.trackingNumber || null,
        status: shipmentData?.status || 'PENDING',
        shippingAddress:
          shipmentData?.shippingAddress !== undefined && shipmentData?.shippingAddress !== null
            ? typeof shipmentData.shippingAddress === 'string'
              ? shipmentData.shippingAddress
              : JSON.stringify(shipmentData.shippingAddress)
            : null,
        estimatedDelivery: shipmentData?.estimatedDelivery ? new Date(shipmentData.estimatedDelivery) : null,
      },
      create: {
        orderId,
        carrier: shipmentData?.carrier || null,
        trackingNumber: shipmentData?.trackingNumber || null,
        status: shipmentData?.status || 'PENDING',
        shippingAddress:
          shipmentData?.shippingAddress !== undefined && shipmentData?.shippingAddress !== null
            ? typeof shipmentData.shippingAddress === 'string'
              ? shipmentData.shippingAddress
              : JSON.stringify(shipmentData.shippingAddress)
            : null,
        estimatedDelivery: shipmentData?.estimatedDelivery ? new Date(shipmentData.estimatedDelivery) : null,
      },
    });
  }

  async trackShipment(shipmentId: number | string, userId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: String(shipmentId), order: { userId } },
    });

    return {
      shipmentId: shipment?.id || String(shipmentId),
      status: shipment?.status || 'PENDING',
      estimatedDelivery: shipment?.estimatedDelivery || null,
      trackingNumber: shipment?.trackingNumber || null,
    };
  }
}
