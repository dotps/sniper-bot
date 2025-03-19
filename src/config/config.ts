import {ConfigModule} from "@nestjs/config"

export const configModule = ConfigModule.forRoot({
    envFilePath: ".env",
    isGlobal: true,
})

export enum Config {
    APP_PORT = "APP_PORT",
    DATABASE_URL = "DATABASE_URL",
    JWT_SECRET = "JWT_SECRET",
    JWT_EXPIRES = "JWT_EXPIRES",
}