export class ResponseData {
  public data: string[] = []

  constructor(data?: string[]) {
    if (data) this.data = data
  }
}
