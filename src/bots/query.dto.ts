import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator"
import { Type } from "class-transformer"

export class ChatQueryDto {
  @IsNotEmpty()
  @IsInt()
  id: number

  @IsNotEmpty()
  @IsString()
  first_name: string

  @IsOptional()
  @IsString()
  last_name: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsOptional()
  @IsString()
  type: string
}

export class UserQueryDto {
  @IsNotEmpty()
  @IsInt()
  id: number

  @IsNotEmpty()
  @IsBoolean()
  is_bot: boolean

  @IsNotEmpty()
  @IsString()
  first_name: string

  @IsOptional()
  @IsString()
  last_name: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsOptional()
  @IsString()
  language_code: string
}

export class MessageQueryDto {
  @IsNotEmpty()
  @IsInt()
  message_id: number

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UserQueryDto)
  from: UserQueryDto

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ChatQueryDto)
  chat: ChatQueryDto

  @IsNotEmpty()
  @IsInt()
  date: number

  @IsNotEmpty()
  @IsString()
  text: string
}

export class QueryDto {
  @IsNotEmpty()
  @IsInt()
  update_id: number

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MessageQueryDto)
  message: MessageQueryDto
}
