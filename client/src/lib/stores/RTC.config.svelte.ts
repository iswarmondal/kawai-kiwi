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

	getPeerConnection(): RTCPeerConnection {
		return this.peerConnection;
	}

	async answerOffer(offer: RTCSessionDescriptionInit) {
		await this.peerConnection.setRemoteDescription(offer);
	}

	async createOffer() {
		const offer = await this.peerConnection.createOffer();
		this.peerConnection.setLocalDescription(offer);
		return offer;
	}

	async createAnswer() {
		const answer = await this.peerConnection.createAnswer();
		this.peerConnection.setLocalDescription(answer);
		return answer;
	}
}

export const rtcConfig = new RTCConfig();
