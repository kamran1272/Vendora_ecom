import { Injectable } from '@nestjs/common';

@Injectable()
export class ShippingService {
  private shipments: any[] = [];

  calculateShippingCost(weight: number, distance: number) {
    const baseCost = 5;
    const weightCost = weight * 0.5;
    const distanceCost = (distance / 100) * 2;
    return baseCost + weightCost + distanceCost;
  }

  createShipment(shipmentData: any) {
    const shipment = { id: Math.random(), ...shipmentData, status: 'pending', createdAt: new Date() };
    this.shipments.push(shipment);
    return shipment;
  }

  trackShipment(shipmentId: number) {
    return { shipmentId, status: 'in-transit', estimatedDelivery: new Date() };
  }
}
