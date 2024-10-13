import { IsString, IsUrl, IsUUID } from 'class-validator';

export class PaymentsOrderDto {
  @IsString()
  stripePaymentId: string;
  @IsString()
  @IsUUID()
  orderId: string;
  @IsString()
  @IsUrl()
  recipeUrl: string;
}
