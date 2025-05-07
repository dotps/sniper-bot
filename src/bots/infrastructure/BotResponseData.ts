export class BotResponseData {
  public data: string[] = []

  constructor(data?: string[] | string) {
    if (data) this.data = Array.isArray(data) ? data : [data]
  }
}
