import { Logger } from "../utils/Logger"
import { IWebRequestService } from "./IWebRequestService"

export class WebRequestFetchService implements IWebRequestService {
  async tryGet<T>(url: string): Promise<T | null> {
    try {
      Logger.log(`Query: ${url}`)

      const response = await fetch(encodeURI(url))
      const responseData = (await response.json()) as T

      if (!response.ok) {
        Logger.error(`${response.status} ${response.statusText} ${JSON.stringify(responseData)}`)
        return null
      }

      Logger.log(`Response: ${JSON.stringify(responseData)}`)

      return responseData
    } catch (e) {
      Logger.error(`${e}`)
      return null
    }
  }
}
