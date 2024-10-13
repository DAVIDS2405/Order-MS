import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  OrderPaginationDTO,
  PaymentsOrderDto,
} from './dto';
@Controller()
export class OrdersController {
  constructor(private readonly client: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.client.create(createOrderDto);
    const paymentSession = await this.client.createPaymentSession(order);
    return {
      order,
      paymentSession,
    };
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDTO: OrderPaginationDTO) {
    return this.client.findAll(orderPaginationDTO);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.client.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeOrderStatus: ChangeOrderStatusDto) {
    return this.client.changeStatus(changeOrderStatus);
  }
  @EventPattern('payment.succeeded')
  paidOrder(@Payload() paidOrderDto: PaymentsOrderDto) {
    return this.client.paidOrder(paidOrderDto);
  }
}
