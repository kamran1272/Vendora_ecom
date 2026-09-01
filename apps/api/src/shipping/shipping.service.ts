import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  calculateShippingCost(weight: number, distance: number) {
    const baseCost = 5;
    const weightCost = weight * 0.5;
    const distanceCost = (distance / 100) * 2;
    return baseCost + weightCost + distanceCost;
  }

  async createShipment(shipmentData: any) {
    const orderId = shipmentData?.orderId ? String(shipmentData.orderId) : null;

    if (!orderId) {
      throw new Error('Order ID is required to create shipment.');
    }

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

  async trackShipment(shipmentId: number | string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: String(shipmentId) },
    });

    return {
      shipmentId: shipment?.id || String(shipmentId),
      status: shipment?.status || 'PENDING',
      estimatedDelivery: shipment?.estimatedDelivery || null,
      trackingNumber: shipment?.trackingNumber || null,
    };
  }
}
