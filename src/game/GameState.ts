import { IGameSettings } from "../Config";
import { IPlayer } from "./IPlayer";
import { PlayersColection } from "./PlayersColection";
export class GameState {
    private allPlayers: PlayersColection;
    private currentPlayers: PlayersColection;
    constructor(settings: IGameSettings) {
        this.allPlayers = new PlayersColection(10000);
        this.currentPlayers = new PlayersColection(settings.countOfPlayers);
    }
    addplayer(player: IPlayer): boolean {
        this.allPlayers.addplayer(player);
        return this.currentPlayers.addplayer(player);
    }
    removePlayer(playerId: number) {
        this.allPlayers.removePlayer(playerId);
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
