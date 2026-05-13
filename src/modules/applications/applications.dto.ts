import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateAppDto {
  @IsNotEmpty()
  declare name: string;

  @IsOptional()
  declare about: string;

  @IsNotEmpty()
  @IsUUID()
  declare appType: string;
}

export class InvitePeopleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  declare emails: string[];
}
