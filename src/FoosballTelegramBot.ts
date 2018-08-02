var TelegramBot = require("node-telegram-bot-api");
import { servicesReporitory } from "./ServiceLocator"
import { ITelegramBotSettings } from "./Config";

export class FoosballTelegramBot {
	private readonly options: ITelegramBotSettings;
	private bot;

	constructor(options: ITelegramBotSettings) {
		this.options = options;
	}

	// WebHook
	processUpdate(messageBody) {
		this.bot.processUpdate(messageBody);
	}

	editMessage(chatId: number, messageId: number, message: string) {
		this.bot.editMessageText(message, { chat_id: chatId, message_id: messageId, parse_mode: "HTML" });
	}

	deleteMessage(chatId: number, messageId: number) {
		this.bot.deleteMessage(chatId, messageId);
	}

	sendMessageTorrentDownloaded(chatId: number, message: string, torrentHash: string) {
		const keyboard = [
			this.createKeyboardButton("Yes", CallbackData.create(BotCallbackActions.RemoveTorrent, torrentHash))
		];
		const opts = this.createSendMessageOptions(keyboard);
		this.bot.sendMessage(chatId, message, opts);
	}

	activate() {
		const self = this;

		if (this.options.useWebHooks) 
		{
			this.bot = new TelegramBot(this.options.token);
			// callback routing configured in server.ts
			this.bot.setWebHook(`${this.options.webHooksBaseUrl}/bot${this.options.token}`); 
		}
		else
		{
			this.bot = new TelegramBot(this.options.token, { polling: true });
		}

		this.bot.onText(/\/echo (.+)/, (msg, match) => {
			const chatId = msg.chat.id;
			const resp = match[1];
			this.bot.sendMessage(chatId, resp);
		});

		this.bot.onText(/\/getChatId/, (msg) => {
			const chatId = msg.chat.id;
			this.bot.sendMessage(chatId, chatId);
		});

		this.bot.onText(/\/start/, 
			async (msg) => await this.startGame(msg, self));

		this.bot.on('callback_query', async callbackQuery => {
			const callbackData = CallbackData.parse(callbackQuery.data);
			const msg = callbackQuery.message;
			const chatId = msg.chat.id;
			switch (callbackData.action) {
				case BotCallbackActions.Cancel:
					this.cancelCalback(callbackQuery.id, chatId, msg);
					return;
				case BotCallbackActions.JoinGame:
					await this.joinGameCalback(callbackQuery.id, chatId, msg, callbackData.data);
					return;
				default:
					console.warn(`Unknown callback action registered: '${callbackData.toString()}'`);
			}
		});
		
		return console.log(`bot is activated`)
	}

	private async startGame(msg, self: this) {			
		const chatId = msg.chat.id;
		const username = msg.from.first_name;
		const userId = msg.from.id;
		
		try {
			const callbackData = CallbackData.create(BotCallbackActions.JoinGame, [userId]);
			const keyboard = [this.createKeyboardButton(`Join`, callbackData)];
			const message = this.createStartGameMessage(username);
			const opts = this.createSendMessageOptions(keyboard);
			this.bot.sendMessage(chatId, message, opts);
			// <a href="tg://user?id=123456789">inline mention of a user</a>
		} catch (e) {
			this.bot.sendMessage(chatId, `Something went wrong. Reason: ${e.message}`);
		} 
	}

	private createStartGameMessage(userName: string) {
		return `Let's play foosball!\r\nJoined: ${userName}`;
	}
	
	private cancelCalback(callbackId, chatId, message) {
		this.editMessage(chatId, message.message_id, "The game is canceled.")
	}

	private async joinGameCalback(callbackId, chatId, message, torrentTrackerId: string) {
		 
	}

	private createKeyboardButton(text: string, callbackData: CallbackData) {
		return [
			{
				text: text,
				callback_data: callbackData.toString()
			}
		];
	}

	private createCancelInlineButton() {
		return this.createKeyboardButton("Cancel", CallbackData.create(BotCallbackActions.Cancel));
	}

	private createSendMessageOptions(keyboard) {
		if (keyboard) {
			keyboard.push(this.createCancelInlineButton());
		}

		const opts = this.createOptions(keyboard);
		return opts;
	}

	private createOptions(keyboard = null) {
		var res = {
			reply_markup: null,
			disable_web_page_preview: true,
			parse_mode: "HTML"
		};

		if (keyboard) {
			res.reply_markup = {
					inline_keyboard: keyboard
				};
		}
		return res;
	}
}

class CallbackData {
	readonly action: BotCallbackActions;
	readonly data: string[];

	private constructor(action: BotCallbackActions, data: string[]) {
		this.action = action;
		this.data = data;
	}

	toString() {
		return `${this.action}|${this.data.join('|')}`;
	}

	static parse(callbackData: string): CallbackData {
		const matches = callbackData.match(/^(\d+)\|([\w\|]*)$/);
		if (!matches || matches.length < 3) {
			throw new Error(`Callback data has incorrect format. Expected '{actionType(0)}|{data}[...|{data}|{data}...]', Actual: '${callbackData}'`);
		}

		const action: BotCallbackActions = Number(matches[1]);
		return new CallbackData(action, matches[2].split('|'));
	}

	static create(action: BotCallbackActions, data: string[] = []): CallbackData {
		return new CallbackData(action, data);
	}
}

enum BotCallbackActions {
	Cancel = 0,
	JoinGame = 1
}