import { Logger } from "../utils/Logger"
import { IWebRequestService } from "./IWebRequestService"

export class WebRequestFetchService implements IWebRequestService {
  async tryGet<T>(url: string): Promise<T> {
    try {
      Logger.log(`Query: ${url}`)

      const response = await fetch(url)
      const responseData = (await response.json()) as T

      if (!response.ok) {
        Logger.error(`${response.status} ${response.statusText} ${JSON.stringify(responseData)}`)
        throw new Error("WebRequest Error")
      }

      Logger.log(`Response: ${JSON.stringify(responseData)}`)

      return responseData
    } catch (e) {
      Logger.error(`${e}`)
      throw new Error("WebRequest Error")
    }
  }
}
