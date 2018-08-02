import { Config } from "./Config"
import { FoosballTelegramBot } from "./FoosballTelegramBot"

class ServiceLocator {
	config = require('config') as Config;
	telegramBot = new MoviesDownloaderTelegramBot(this.config.telegramBotSettings);
}

export let servicesReporitory = new ServiceLocator();