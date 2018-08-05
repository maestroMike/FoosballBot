import { Server } from "./Server";
import { serviceLocator } from "./ServiceLocator"

process.on('unhandledRejection', (reason) => {
	console.log(reason);
});

serviceLocator.telegramBot.activate();

let server = new Server();
server.defineRoutes();
server.startListening();