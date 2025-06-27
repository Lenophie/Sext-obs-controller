import OBSWebSocket from 'obs-websocket-js';
import { SDUtils } from './utils';

class Socket extends OBSWebSocket {
	_ip;
	_port;
	_password;
	_isConnected = false;

	constructor(ip?: string, port?: string | number, password?: string) {
		super();
		this._ip = ip;
		this._port = port;
		this._password = password;

		this.on('ConnectionOpened', () => SDUtils.logDebug(`WS initial connection opened to server at ${this._ip}:${this._port}`));
		this.on('Hello', (data) => SDUtils.logDebug(`WS server at ${this._ip}:${this._port} sent Hello message - OBS WS Version: ${data.obsWebSocketVersion} | RPC Version: ${data.rpcVersion}`));

		this.on('Identified', () => {
			this._isConnected = true;
			const logStr = `[CONNECTED] OBS Websocket server at ${this._ip}:${this._port}`;
			SDUtils.logDebug(`Identified to WS server at ${this._ip}:${this._port}`);
			SDUtils.log(logStr);
		});

		this.on('ConnectionClosed', (e) => {
			if (!e.message) {
				SDUtils.logDebug(`WS server at ${this._ip}:${this._port} unreachable/closed connection (${e.code})`);
			}
			else {
				SDUtils.logDebug(`WS server at ${this._ip}:${this._port} closed connection: ${e.message} (${e.code})`);
			}

			if (this._isConnected) {
				const logStr = `[DISCONNECTED] OBS Websocket server at ${this._ip}:${this._port}`;
				SDUtils.log(logStr);
				// @ts-expect-error Disconnected event is custom, not part of the OBS WS protocol
				this.emit('Disconnected');	// custom event for internal purposes
			}
			this._isConnected = false;
		});
	}

	get isConnected() {
		return this._isConnected;
	}

	/**
	 * Connect WS, if not already connected and if valid ip/port
	 */
	tryConnect() {
		if (this._isConnected || !this._ip || !this._port) return;
		this.connect(`ws://${this._ip}:${this._port}`, this._password)
		.catch(() => { /* Error while connecting - logs on socket events */ });
	}

	/**
	 * Force Reconnect WS
	 */
	async tryReconnect() {
		await this.disconnect().catch(() => { /* Error while disconnecting */ });
		this.tryConnect();
	}

	/**
	 * Update ip/port/pwd settings, and reconnect if needed
	 * @param {string} ip
	 * @param {string} port
	 * @param {string?} password
	 */
	updateSettings(ip: string, port: string | number, password?: string) {
		if (this._ip !== ip || this._port !== port || this._password !== password) {
			this._ip = ip;
			this._port = port;
			this._password = password;
			if (!this._ip || !this._port) {
				this.disconnect().catch(() => { /* Error while disconnecting */ });
			}
			else {
				this.connect(`ws://${this._ip}:${this._port}`, this._password)
				.catch(() => { /* Error while connecting - logs on socket events */ });
			}
		}
	}
}

export const NUM_SOCKETS = 6;
export const sockets = new Array(NUM_SOCKETS).fill(null).map(() => new Socket());
