import { Server } from "./Server";
import { servicesReporitory } from "./ServiceLocator"

process.on('unhandledRejection', (reason) => {
	console.log(reason);
});

servicesReporitory.telegramBot.activate();

let server = new Server();
server.defineRoutes();
server.startListening();