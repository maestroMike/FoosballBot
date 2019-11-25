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
    private allPlayers: PlayersColection;
    private currentPlayers: PlayersColection;
    
	constructor(settings: IGameSettings) {
        this.allPlayers = new PlayersColection(10000);
        this.currentPlayers = new PlayersColection(settings.countOfPlayers);
    }

    addplayer(player: IPlayer) : boolean
    {
        this.allPlayers.addplayer(player);
        return this.currentPlayers.addplayer(player);
    }

    removePlayer(playerId: number)
    {
        this.currentPlayers.removePlayer(playerId);
    }

	reset() {
		this.currentPlayers.reset();
    }
    
	isReady(): boolean {
        return this.currentPlayers.isFull();
    }
    
	countOfPlayers(): number {
		return this.currentPlayers.countOfPlayers();
    }
    
	getPlayers(): IPlayer[] {
		return this.currentPlayers.getPlayers();
    }
        
	getAllPlayers(): IPlayer[] {
		return this.allPlayers.getPlayers();
    	
	}
}

export class PlayersColection
{
    private players: IPlayer[] = [];
    private maxCountOfPlayers: number;
    
	constructor(maxCountOfPlayers: number) {
		this.maxCountOfPlayers = maxCountOfPlayers;
    }

    addplayer(player: IPlayer) : boolean
    {
        if (this.players.find(x => x.id == player.id)) {
            return false;
        }

        if(this.players.length >= this.maxCountOfPlayers)
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
    
	isFull(): boolean {
        return this.players.length == this.maxCountOfPlayers;
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