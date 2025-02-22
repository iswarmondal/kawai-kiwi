import { io, Socket } from 'socket.io-client';

class SocketStore {
	private socket = $state<Socket>(io('http://localhost:8080'));

	getSocket() {
		return this.socket;
	}

	connect() {
		this.socket.connect();
	}

	disconnect() {
		this.socket.disconnect();
	}

	sendMessage(message: string, data: any) {
		this.socket.emit('message', message, data);
	}
}

export const socketStore = new SocketStore();
