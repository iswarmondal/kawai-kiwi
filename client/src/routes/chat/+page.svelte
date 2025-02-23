<script lang="ts">
	import { browser } from '$app/environment';
	import { userStore } from '$lib/stores/user.svelte';
	import { goto } from '$app/navigation';
	import { socketStore } from '$lib/stores/socket.svelte';
	import { rtcConfig } from '$lib/stores/RTC.config.svelte';

	const socket = socketStore.getSocket();
	let localStream = $state<MediaStream | null>(null);
	let localVideo = $state<HTMLVideoElement | null>(null);

	let remoteStream = $state<MediaStream | null>(null);
	let remoteVideo = $state<HTMLVideoElement | null>(null);

	let peerConnection = $state<RTCPeerConnection | null>(null);

	let findingPeerTimeout = $state<NodeJS.Timeout | null>(null);

	// $effect(() => {
	// 	if (browser && !userStore.isLoading() && !userStore.getUser()) {
	// 		goto('/login');
	// 	}
	// });

	socket.on('peer:accepted', () => {
		if (findingPeerTimeout) {
			clearTimeout(findingPeerTimeout);
		}
	});

	socket.on('peer:found', async () => {
		if (findingPeerTimeout) {
			clearTimeout(findingPeerTimeout);
		}

		if (!localStream) {
			alert('Error: No local stream found');
			return;
		}

		peerConnection = rtcConfig.getPeerConnection();

		peerConnection.addTrack(localStream.getTracks()[0], localStream);

		const offer = await rtcConfig.createOffer();
		socketStore.sendConnectionOffer(offer);
	});

	socket.on('peer:sent:icecandidate', (candidate) => {
		if (!rtcConfig.getPeerConnection()) {
			throw new Error('Error: No peer connection found');
		}
		if (candidate.candidate) {
			console.log('adding ice candidate', candidate);
			rtcConfig.getPeerConnection().addIceCandidate(new RTCIceCandidate(candidate));
		}
	});

	socket.on('peer:call', async (offer) => {
		await rtcConfig.answerOffer(offer);
		const answer = await rtcConfig.createAnswer();
		socketStore.sendConnectionAnswer(answer);
	});

	socket.on('peer:answer', async (answer) => {
		if (!rtcConfig.getPeerConnection()) {
			throw new Error('Error: No peer connection found');
		}
	});

	socket.on('peer:alone', () => {
		findingPeerTimeout = setTimeout(() => {
			socketStore.findPeer();
		}, 7000);
	});

	const handleVideoChatStart = async () => {
		try {
			localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			if (localVideo) {
				localVideo.srcObject = localStream;
			}
			socketStore.findPeer();
		} catch (error) {
			console.error('Error getting user media:', error);
			alert('Error getting user media, please try again');
		}
	};

	rtcConfig.getPeerConnection().onicecandidate = (event) => {
		if (event.candidate) {
			console.log('sending ice candidate', event.candidate);
			socketStore.sendIceCandidate(event.candidate);
		}
	};

	rtcConfig.getPeerConnection().ontrack = (event) => {
		if (event.streams[0]) {
			console.log('ontrack', event);
			remoteStream = event.streams[0];
			if (remoteStream) {
				console.log('remoteVideo', remoteVideo);
				// remoteVideo.srcObject = remoteStream;
			}
		}
	};

	const handleVideoChatStop = () => {
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			localStream = null;
			if (localVideo) {
				localVideo.srcObject = null;
			}
		}
	};
</script>

{#if userStore.isLoading()}
	<div class="flex min-h-[60vh] items-center justify-center">
		<div class="space-y-4 text-center">
			<span class="loading loading-dots loading-lg text-neon-cyan"></span>
			<p class="text-neon-cyan/80 animate-pulse font-mono">ESTABLISHING_SECURE_CONNECTION...</p>
		</div>
	</div>
{:else}
	<div class="space-y-4">
		<div class="text-center">
			<h1 class="glitch text-neon-green text-4xl font-bold md:text-5xl" data-text="SECURE_CHAT">
				SECURE_CHAT
			</h1>
			<p class="text-neon-cyan/80 mt-4 font-mono">
				Connected as: {userStore.getUser()?.email}
				<br />
				<em class="text-neon-cyan/80 text-xs">Do not worry your email is private 🤐</em>
			</p>
		</div>

		<!-- Chat interface will go here -->
		<div
			class="card bg-base-100/10 border-neon-cyan/20 flex min-h-[85vh] flex-col items-center justify-between border-2 p-2 backdrop-blur-sm md:p-8"
		>
			<div
				class="flex h-[65vh] w-full flex-col items-center justify-center gap-4 md:flex-row"
				class:hidden={!localStream}
			>
				<video
					id="remoteVideo"
					bind:this={remoteVideo}
					autoplay
					playsinline
					class="rounded-xl transition-all duration-300 {remoteStream !== null
						? 'h-[300px] w-[400px] md:h-[500px] md:w-[600px]'
						: 'h-0 w-0'}"
				>
					<track kind="captions" label="Video Chat Captions" src="" default />
				</video>
				<video
					id="localVideo"
					bind:this={localVideo}
					autoplay
					playsinline
					muted
					class="border-neon-cyan rounded-xl border-2 bg-cover bg-center transition-all duration-300 {remoteStream !==
					null
						? 'h-0 w-0'
						: 'h-[100px] w-[300px] md:h-[300px] md:w-[500px]'}"
				>
					<track kind="captions" label="Video Chat Captions" src="" default />
				</video>
			</div>

			<div class="mt-8 flex justify-center">
				<button
					class="btn btn-lg bg-neon-cyan/20 border-neon-cyan hover:bg-neon-pink/20 hover:border-neon-pink text-neon-cyan hover:text-neon-pink hover-glow border-2 px-8 py-2 font-mono text-xl md:px-12 md:py-4"
					onclick={() => {
						if (localStream) {
							handleVideoChatStop();
						} else {
							handleVideoChatStart();
						}
					}}
				>
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
						{#if localStream}
							STOP_VIDEO_CHAT [⏸]
						{:else}
							START_VIDEO_CHAT [▶]
						{/if}
					</div>
				</button>
			</div>
		</div>
	</div>
{/if}
