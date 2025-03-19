export interface IModel {
    stopApp(): void
    isAppRunning(): boolean
    isBotInit(): boolean
    botWasInit(): void
}