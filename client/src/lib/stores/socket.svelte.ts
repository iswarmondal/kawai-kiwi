import { io, Socket } from 'socket.io-client';
import { PUBLIC_SOCKET_SERVER_URL } from '$env/static/public';
import { userStore } from './user.svelte';

class SocketStore {
	private socket = $state<Socket | null>(null);

	getSocket() {
		return this.socket;
	}

	async connect() {
		try {
			this.disconnect();
			if (!PUBLIC_SOCKET_SERVER_URL || PUBLIC_SOCKET_SERVER_URL === null) {
				throw Error('Socket server url not found in env');
			}
			this.socket = io(PUBLIC_SOCKET_SERVER_URL, {
				auth: {
					token: await userStore.getIdToken()
				}
			});
			return this.socket;
		} catch (e) {
			console.log(e);
			throw new Error('Socket connection error');
		}
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
		}
	}

	findPeer() {
		console.log('finding peer');
		if (this.socket) {
			this.socket.emit('peer:find');
		}
	}

	sendMessage(message: string, data: RTCSessionDescriptionInit | RTCIceCandidateInit) {
		if (this.socket) {
			this.socket.emit('message', message, data);
		}
	}

	sendConnectionOffer(offer: RTCSessionDescriptionInit) {
		if (this.socket) {
			this.socket.emit('peer:offer', offer);
		}
	}

	sendConnectionAnswer(answer: RTCSessionDescriptionInit) {
		if (this.socket) {
			this.socket.emit('peer:answer', answer);
		}
	}

	sendIceCandidate(candidate: RTCIceCandidateInit) {
		if (this.socket) {
			this.socket.emit('peer:sent:icecandidate', candidate);
		}
	}
}

export const socketStore = new SocketStore();
