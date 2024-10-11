import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/commons';
import { OrderStatusList } from '../enum/order.enum';
import { OrderStatus } from '@prisma/client';

export class OrderPaginationDTO extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Possible status values are ${OrderStatusList}`,
  })
  status: OrderStatus;
}
