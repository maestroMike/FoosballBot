var TelegramBot = require("node-telegram-bot-api");
import { serviceLocator } from "./ServiceLocator"
import { ITelegramBotSettings } from "./Config";
import { IPlayer } from "./game/IPlayer";
var emoji = require('node-emoji').emoji;

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

	sendMessage(chatId: number, message: string) {
		const opts = this.createSendMessageOptions(null);
		return this.bot.sendMessage(chatId, message, opts);
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
			this.bot = new TelegramBot(this.options.token,  { 
					polling: true,
					request: {
						proxy: this.options.proxy,
				  	},
			 });
		}

		this.bot.onText(/\/echo (.+)/, async (msg, match) => await this.sendMessage(msg.chat.id, match[1]));

		this.bot.onText(/\/getChatId/, async (msg) => await this.sendMessage(msg.chat.id, msg.chat.id));

		this.bot.onText(/\/startGame/, async (msg) => await this.startGame(msg, self));			

		this.bot.onText(/\/reset/, (msg) => serviceLocator.gameHolder.get(msg.chat.id).reset());

		this.bot.onText(/\/anybodyelse/, async (msg) =>  await this.anybodyElse(msg, self));

		this.bot.onText(/^\/\+/, async (msg) => await this.joinPlayer(msg.chat.id, this.getPlayers(msg)));

		this.bot.onText(/^\+/, async (msg) => await this.joinPlayer(msg.chat.id, this.getPlayers(msg)));
		
		this.bot.onText(/^-/, async (msg) => await this.removePlayer(msg.chat.id, this.getPlayers(msg)));
		
		this.bot.onText(/^\/-/, async (msg) => await this.removePlayer(msg.chat.id, this.getPlayers(msg)));

		this.bot.on('callback_query', async callbackQuery => {
			const callbackData = CallbackData.parse(callbackQuery.data);
			const msg = callbackQuery.message;
			const chatId = msg.chat.id;
			switch (callbackData.action) {
				case BotCallbackActions.Cancel:
					this.cancelCalback(callbackQuery.id, chatId, msg);
					return;
				case BotCallbackActions.JoinGame:
					// await this.joinGameCalback(callbackQuery.id, chatId, msg, callbackData.data);
					return;
				default:
					console.warn(`Unknown callback action registered: '${callbackData.toString()}'`);
			}
		});
		
		return console.log(`bot is activated`)
	}

	private playerToString(x : IPlayer, isMention: boolean = true) : string {
		const name = `${x.first_name} ${x.last_name || ''}`;
		if(isMention)
		{
			return `<a href="tg://user?id=${x.id}">${name}</a>`;
		}
		else
		{
			return name;
		}
	}

	getNumberMarkdown(int: number): string {
		switch (int) {
			case 0:
				return emoji.zero;
			case 1:
				return emoji.one;
			case 2:
				return emoji.two;
			case 3:
				return emoji.three;
			case 4:
				return emoji.four;
			case 5:
				return emoji.five;
			default:
				return int.toString();
		}
	}

	private getPlayers(msg) : IPlayer[]
	{
		if (!msg.entities) {
			return [msg.from];	
		}

		const mentions = msg.entities.map(e => e.user).filter(u => u != null);
		if (mentions.length == 0) {
			return [msg.from];
		}
	
		return mentions;
	}
	
	private async anybodyElse(msg, self: this) {			
		const chatId = msg.chat.id;
		
		try {			
			const game = serviceLocator.gameHolder.get(msg.chat.id);
			const all = game.getAllPlayers();
			const playersToExclude = game.getPlayers().concat(this.getPlayers(msg));
			const missing = all.filter(x => !playersToExclude.some(y => x.id == y.id));
			
			this.sendMessage(chatId, `Anybody else? ${missing.map(x => this.playerToString(x)).join(' , ')}.`);
		} catch (e) {
			this.bot.sendMessage(chatId, `Something went wrong. Reason: ${e.message}`);
		} 
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
		} catch (e) {
			this.bot.sendMessage(chatId, `Something went wrong. Reason: ${e.message}`);
		} 
	}
		
	private async joinPlayer(chatId : number, playersToAdd: IPlayer[]) {	
		try {
			var game = serviceLocator.gameHolder.get(chatId);
			playersToAdd.forEach(player => {
				game.addplayer(player)
			});

			var number = this.getNumberMarkdown(game.countOfPlayers());
			const players = game.getPlayers();
			
			if(game.isReady())
			{
				const playersNames = players.map(x => this.playerToString(x)).join(' , ');
				this.sendMessage(chatId, `${number} Players ${playersNames} please proceed to the meeting room.`);
				game.reset();
				return;	
			}

			const playersNames = players.map(x => this.playerToString(x, false)).join(' , ');
			this.sendMessage(chatId, `${number} ${playersNames}.`);
		} catch (e) {
			this.bot.sendMessage(chatId, `Something went wrong. Reason: ${e.message}`);
		} 
	}

	private async removePlayer(chatId : number, players: IPlayer[]) {	
		try {			
			var game = serviceLocator.gameHolder.get(chatId);
			players.forEach(player => {
				game.removePlayer(player.id)
			});
			var number = this.getNumberMarkdown(game.countOfPlayers());
			
			const playersNames = game.getPlayers().map(x => this.playerToString(x, false)).join(' , ');
			this.sendMessage(chatId, `${number} ${playersNames}.`);
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
