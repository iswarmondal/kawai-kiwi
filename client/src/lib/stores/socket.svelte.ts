import { io, Socket } from 'socket.io-client';

class SocketStore {
	private socket = $state<Socket>(io('http://192.168.1.2:8080'));

	getSocket() {
		return this.socket;
	}

	connect() {
		this.disconnect();
		this.socket = io('http://192.168.1.2:8080');
	}

	disconnect() {
		this.socket.disconnect();
	}

	findPeer() {
		console.log('finding peer');
		this.socket.emit('peer:find');
	}

	sendMessage(message: string, data: RTCSessionDescriptionInit | RTCIceCandidateInit) {
		this.socket.emit('message', message, data);
	}

	sendConnectionOffer(offer: RTCSessionDescriptionInit) {
		this.socket.emit('peer:offer', offer);
	}

	sendConnectionAnswer(answer: RTCSessionDescriptionInit) {
		this.socket.emit('peer:answer', answer);
	}

	sendIceCandidate(candidate: RTCIceCandidateInit) {
		this.socket.emit('peer:sent:icecandidate', candidate);
	}
}

export const socketStore = new SocketStore();
