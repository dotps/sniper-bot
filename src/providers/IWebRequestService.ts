// export interface IWebRequestService {
//   tryGet(url: string): Promise<any>
// }
export interface IWebRequestService {
  tryGet<T>(url: string): Promise<T>
}
