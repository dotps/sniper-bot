import {Logger} from "../Utils/Logger"
import {IWebRequestService} from "./IWebRequestService"

export class WebRequestFetchService implements IWebRequestService {

    async tryGet(url: string): Promise<any> {
        try {
            Logger.log(`Query: ${url}`)

            const response = await fetch(url)
            const responseData = await response.json()

            if (!response.ok) {
                Logger.error(`${response.status} ${response.statusText} ${JSON.stringify(responseData)}`)
                return null
            }

            Logger.log(`Response: ${JSON.stringify(responseData)}`)

            return responseData
        }
        catch (e) {
            Logger.error(`${e}`)
            return null
        }
    }
}