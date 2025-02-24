import { io, Socket } from 'socket.io-client';
import { PUBLIC_SOCKET_SERVER_URL } from '$env/static/public';

class SocketStore {
	private socket = $state<Socket>(io(PUBLIC_SOCKET_SERVER_URL));

	getSocket() {
		return this.socket;
	}

	async connect(idToken: string) {
		try {
			this.disconnect();
			if (!PUBLIC_SOCKET_SERVER_URL || PUBLIC_SOCKET_SERVER_URL === null) {
				throw Error('Socket server url not found in env');
			}
			this.socket = io(PUBLIC_SOCKET_SERVER_URL, {
				auth: {
					token: idToken
				}
			});
		} catch (e) {
			console.log(e);
			throw new Error('Socket connection error');
		}
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
