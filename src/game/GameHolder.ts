import { IGameSettings } from "../Config";
import { GameState } from "./GameState";

export class GameHolder {
	private readonly settings: IGameSettings;

    private gamesMap : { [chatId: number]: GameState; } = { };

	constructor(settings: IGameSettings) {
		this.settings = settings;
    }
    
    get(chatId: number) : GameState
    {
        let game = this.gamesMap[chatId];
        if (game == null) {
            game = new GameState(this.settings);
            this.gamesMap[chatId] = game;
        }

        return game;
    }
}

