import { ResponseData } from "../data/ResponseData"
import { ICommand } from "./ICommand"
import { IModel } from "../Model/IModel"

export class ExitCommand implements ICommand {
  private model: IModel
  private response: string[] = ["Выход."]

  constructor(model: IModel) {
    this.model = model
  }

  async execute(): Promise<ResponseData | null> {
    this.model.stopApp()
    return new ResponseData(this.response)
  }
}
