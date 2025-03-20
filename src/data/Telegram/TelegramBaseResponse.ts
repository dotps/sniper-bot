export class TelegramBaseResponse {
  ok: boolean
  result: {
    id: number
  }

  constructor(response: any) {
    this.ok = response?.ok
    this.result = response?.result
  }
}
