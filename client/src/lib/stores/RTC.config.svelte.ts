class RTCConfig {
	private ICE_SERVERS = [
		{
			urls: 'stun:stun.l.google.com:19302'
		}
	];
	private peerConnection: RTCPeerConnection = $state(
		new RTCPeerConnection({
			iceServers: this.ICE_SERVERS,
			iceCandidatePoolSize: 10
		})
	);

	private createNewPeerConnection(): RTCPeerConnection {
		this.peerConnection = new RTCPeerConnection({
			iceServers: this.ICE_SERVERS,
			iceCandidatePoolSize: 10
		});
		return this.peerConnection;
	}

	getPeerConnection(): RTCPeerConnection {
		return this.peerConnection;
	}

	setupPeerConnection(
		localStream: MediaStream,
		onTrackCallback: (event: RTCTrackEvent) => Promise<void>,
		onIceCandidateCallback: (event: RTCPeerConnectionIceEvent) => void,
		onDisconnectCallback: () => void
	): RTCPeerConnection {
		// Create a new peer connection
		this.createNewPeerConnection();

		// Add all the tracks from localStream to the peerConnection
		localStream.getTracks().forEach((track) => {
			this.peerConnection.addTrack(track, localStream);
		});

		// Setup event listeners
		this.peerConnection.ontrack = onTrackCallback;
		this.peerConnection.onicecandidate = onIceCandidateCallback;

		// Handle connection state changes
		this.peerConnection.oniceconnectionstatechange = () => {
			console.log('ICE connection state:', this.peerConnection.iceConnectionState);
			if (
				this.peerConnection.iceConnectionState === 'disconnected' ||
				this.peerConnection.iceConnectionState === 'failed' ||
				this.peerConnection.iceConnectionState === 'closed'
			) {
				onDisconnectCallback();
			}
		};

		return this.peerConnection;
	}

	async answerOffer(offer: RTCSessionDescriptionInit) {
		await this.peerConnection.setRemoteDescription(offer);
	}

	async createOffer() {
		const offer = await this.peerConnection.createOffer();
		await this.peerConnection.setLocalDescription(offer);
		return offer;
	}

	async createAnswer() {
		const answer = await this.peerConnection.createAnswer();
		await this.peerConnection.setLocalDescription(answer);
		return answer;
	}
}

export const rtcConfig = new RTCConfig();
