import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

export class TelegramChatDto {
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

export class TelegramUserDto {
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

export class TelegramMessageDto {
  @IsNotEmpty()
  @IsInt()
  message_id: number

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TelegramUserDto)
  from: TelegramUserDto

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TelegramChatDto)
  chat: TelegramChatDto

  @IsNotEmpty()
  @IsInt()
  date: number

  @IsNotEmpty()
  @IsString()
  text: string
}

export class TelegramResultDto {
  @IsNotEmpty()
  @IsInt()
  update_id: number

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TelegramMessageDto)
  message: TelegramMessageDto
}

export class TelegramUpdatesDto {
  @IsNotEmpty()
  @IsBoolean()
  ok: boolean

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelegramResultDto)
  result: TelegramResultDto[]
}

export class TelegramBaseDto {
  @IsNotEmpty()
  @IsBoolean()
  ok: boolean
}
