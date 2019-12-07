import { Config } from "./Config"
import { FoosballTelegramBot } from "./FoosballTelegramBot"
import { GameHolder } from "./game/GameHolder"

class ServiceLocator {
	config = require('config') as Config;
	telegramBot = new FoosballTelegramBot(this.config.telegramBotSettings);
	gameHolder = new GameHolder(this.config.gameSettings);
}

export let serviceLocator = new ServiceLocator();