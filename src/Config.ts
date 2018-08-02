export interface Config {
	telegramBotSettings: ITelegramBotSettings;
	port: number;
	allowedGoogleAccounts: string[];
}

export interface ITelegramBotSettings {
	token: string;
	allowedChats: number[];
	useWebHooks: boolean;
	webHooksBaseUrl: string;
}