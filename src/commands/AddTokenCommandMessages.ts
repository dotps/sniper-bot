import { Commands } from "./Commands"

export enum AddTokenCommandMessages {
  TOKEN_LIST = "Список токенов:\n",
  ADDED = "Токен успешно добавлен.",
  NEED_TOKEN = "Укажите токен. " + Commands.ADD_TOKEN + " адрес_токена",
}