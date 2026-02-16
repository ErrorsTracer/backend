import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateAppDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  about: string;

  @IsNotEmpty()
  @IsUUID()
  appType: string;

  @IsNotEmpty()
  @IsUUID()
  orgId: string;
}
