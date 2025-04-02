import { ResponseData } from "../../data/ResponseData"

export interface ICommand {
  execute(): Promise<ResponseData | null>
}
