import { IPlayer } from "./game/IPlayer";
export class PlayersColection {
    private players: IPlayer[] = [];
    private maxCountOfPlayers: number;
    constructor(maxCountOfPlayers: number) {
        this.maxCountOfPlayers = maxCountOfPlayers;
    }
    addplayer(player: IPlayer): boolean {
        if (this.players.find(x => x.id == player.id)) {
            return false;
        }
        if (this.players.length >= this.maxCountOfPlayers) {
            return false;
        }
        this.players.push(player);
        return true;
    }
    removePlayer(playerId: number) {
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
