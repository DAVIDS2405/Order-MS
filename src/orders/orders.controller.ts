import {
  Controller,
  NotImplementedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  OrderPaginationDTO,
} from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly client: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.client.create(createOrderDto);
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
}
