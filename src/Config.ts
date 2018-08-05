export interface Config {
	telegramBotSettings: ITelegramBotSettings;
	gameSettings: IGameSettings;
	port: number;
	allowedGoogleAccounts: string[];
}

export interface ITelegramBotSettings {
	token: string;
	allowedChats: number[];
	useWebHooks: boolean;
	webHooksBaseUrl: string;
}


export interface IGameSettings {
	countOfPlayers: number;
}