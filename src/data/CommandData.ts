import { ICommandDataParams } from "./ICommandDataParams"

export class CommandData {
  input: string
  params?: ICommandDataParams

  constructor(input: string, params?: ICommandDataParams) {
    this.input = input
    this.params = params
  }
}
