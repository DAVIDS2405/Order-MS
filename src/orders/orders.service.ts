import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDTO } from './dto/order-pagination.dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }
  private readonly logger = new Logger('OrderService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }
  async create(createOrderDto: CreateOrderDto) {
    const productIds = createOrderDto.items.map((item) => item.productId);

    try {
      const products = await firstValueFrom(
        this.client.send({ cmd: 'validate_product' }, productIds),
      );

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });
      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(orderPaginationDTO: OrderPaginationDTO) {
    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDTO.status,
      },
    });
    const currentPage = orderPaginationDTO.page;
    const perPage = orderPaginationDTO.limit;

    return {
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDTO.status,
        },
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage),
      },
    };
  }

  async findOne(id: string) {
    try {
      const order = await this.order.findUnique({
        where: { id },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });
      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Order whit id ${id} not found`,
        });
      }
      const productIds = order.OrderItem.map(
        (orderItem) => orderItem.productId,
      );
      const products = await firstValueFrom(
        this.client.send({ cmd: 'validate_product' }, productIds),
      );
      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);
    if (order.status === status) {
      return order;
    }
    return this.order.update({
      where: { id },
      data: { status: status },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
