import { ResponseData } from "../data/ResponseData"

export interface ICommand {
  execute(currencies?: string[] | null): Promise<ResponseData | null>
}
