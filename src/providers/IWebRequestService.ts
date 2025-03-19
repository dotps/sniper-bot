export interface IWebRequestService {
    tryGet(url: string): Promise<any>
}