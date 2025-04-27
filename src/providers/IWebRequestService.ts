export interface IWebRequestService {
  tryGet<T>(url: string): Promise<T | null>
}
