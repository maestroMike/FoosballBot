import { IGameSettings } from "./Config";

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

export class GameState
{
    private players: IPlayer[] = [];
    private settings: IGameSettings;
    
	constructor(settings: IGameSettings) {
		this.settings = settings;
    }

    addplayer(player: IPlayer) : boolean
    {
        if (this.players.find(x => x.id == player.id)) {
            return false;
        }

        if(this.players.length >= this.settings.countOfPlayers)
        {
            return false;
        }

        this.players.push(player);
        return true;
    }

    removePlayer(playerId: number)
    {
        this.players = this.players.filter(x => x.id != playerId);
    }

	reset() {
		this.players = [];
    }
    
	isReady(): boolean {
        return this.players.length == this.settings.countOfPlayers;
    }
    
	countOfPlayers(): number {
		return this.players.length;
    }
    
	getPlayers(): IPlayer[] {
		return this.players.slice();
	}
}

export interface IPlayer
{
    id: number;
    first_name : string;
    last_name : string;
}