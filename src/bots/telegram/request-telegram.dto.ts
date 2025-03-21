import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

export class ChatTelegramDto {
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

export class UserTelegramDto {
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

export class MessageTelegramDto {
  @IsNotEmpty()
  @IsInt()
  message_id: number

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UserTelegramDto)
  from: UserTelegramDto

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ChatTelegramDto)
  chat: ChatTelegramDto

  @IsNotEmpty()
  @IsInt()
  date: number

  @IsNotEmpty()
  @IsString()
  text: string
}

export class ResultTelegramDto {
  @IsNotEmpty()
  @IsInt()
  update_id: number

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MessageTelegramDto)
  message: MessageTelegramDto
}

export class RequestTelegramDto {
  @IsNotEmpty()
  @IsBoolean()
  ok: string

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultTelegramDto)
  result: ResultTelegramDto[]
}
