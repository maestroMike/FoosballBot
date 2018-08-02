import { servicesReporitory } from "./ServiceLocator"
let express = require("express");
let app = express();
let bodyParser = require('body-parser');

export class Server {
	startListening() {
		let port = process.env.port || servicesReporitory.config.port;
		app.listen(port, (err) => {
			if (err) {
				return console.log(err)
			}

			return console.log(`server is listening on ${port}`)
		});
	}

	defineRoutes() {
		const self = this;
		
		// WebHook for bot
        app.use(bodyParser.json());
        app.post(`/bot${servicesReporitory.config.telegramBotSettings.token}`, (req, res) => {
          servicesReporitory.telegramBot.processUpdate(req.body);
          res.sendStatus(200);
		});
		
		app.get("/", (req, res) => {
			if (!self.checkPrincipal(req)) {
				res.sendStatus(403);
				return;
			}
			res.json({
				API: ["/ShowRequestHeaders"]
			});
		});
		app.get("/ShowRequestHeaders", (req, res) => {
			if (!self.checkPrincipal(req)) {
				res.sendStatus(403);
				return;
			}
			res.json(req.headers);
		});
	}

	private checkPrincipal(req) {
		const principalName = req.get("x-ms-client-principal-name") || "any";
		if (servicesReporitory.config.allowedGoogleAccounts.indexOf(principalName) !== -1) {
			return true;
		}

		return false;
	}
}