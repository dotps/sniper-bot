import { ResponseData } from "../data/ResponseData"
import { ICommand } from "./ICommand"

export class ExitCommand implements ICommand {
  private response: string[] = ["Выход."]

  constructor() {}

  async execute(): Promise<ResponseData | null> {
    return new ResponseData(this.response)
  }
}
