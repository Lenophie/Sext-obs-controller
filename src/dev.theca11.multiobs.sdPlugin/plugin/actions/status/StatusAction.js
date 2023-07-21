import { sockets } from "../../sockets.js";

/** Action showing plugin connection status to OBS WS servers */
export class StatusAction extends Action {
	_statuses = [false, false];
	_actionContexts = new Set();
		
	constructor() {
		super('dev.theca11.multiobs.status');
		
		sockets.forEach((socket, idx) => {
			this._statuses[idx] = socket.isConnected;

			socket.on('Identified', () => {
				this._statuses[idx] = true;
				this.updateTitles();
			});
	
			socket.on('ConnectionClosed', () => {
				this._statuses[idx] = false;
				this.updateTitles();
			});
		})

		this.onWillAppear(async ({ context }) => {
			this._actionContexts.add(context);
			this.updateTitles();
		})

		this.onWillDisappear(async ({ context }) => {
			this._actionContexts.delete(context);
		})

	}

	updateTitles() {
		this._actionContexts.forEach(c => {
			$SD.setTitle(c, 'OBS WS\nservers\n\n' + this._statuses.map((s, i) => `OBS#${i+1} ${s ? '🟢' : '🔴'}`).join('\n'));
		});
	}	
}