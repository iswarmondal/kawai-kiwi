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

	let pendingIceCandidates = $state<RTCIceCandidate[]>([]);
	let userIdToken = $state("")

	$effect(() => {
		if (browser && !userStore.isLoading() && !userStore.getUser()) {
			goto('/login');
		}
	});

	// Common handler functions
	const handleTrack = async (event: RTCTrackEvent) => {
		console.log('Track received', event);
		if (event && event.streams[0]) {
			console.log('Stream received', event.streams[0]);
			remoteStream = event.streams[0];
			if (remoteVideo) {
				console.log('Setting remote video source', remoteVideo);
				remoteVideo.srcObject = remoteStream;

				try {
					// wait for the remote video to be ready
					await new Promise((resolve) => {
						remoteVideo!.addEventListener('loadedmetadata', resolve, { once: true });
					});

					remoteVideo.play().catch((error) => {
						console.error('Error playing remote video', error);
					});
				} catch (error) {
					console.error('Error playing remote video', error);

					setTimeout(async () => {
						try {
							await remoteVideo?.play();
						} catch (retryError) {
							console.error('Retry failed: ', retryError);
						}
					}, 1000);
				}
			}
		}
	};

	const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
		if (event.candidate) {
			console.log('sending ice candidate', event.candidate);
			socketStore.sendIceCandidate(event.candidate);
		}
	};

	const handleDisconnect = () => {
		console.log('Peer disconnected, looking for new peer...');
		remoteStream = null;
		if (remoteVideo) {
			remoteVideo.srcObject = null;
		}

		// Close existing peer connection
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}

		// Start looking for a new peer
		socketStore.findPeer();
	};

	const setupSocketListeners = async () => {
		const socket = socketStore.getSocket();
		if (!socket) return;

		socket.on('peer:accepted', () => {
			if (findingPeerTimeout) {
				clearTimeout(findingPeerTimeout);
			}

			if (!localStream) {
				alert('Error: No local stream found');
				return;
			}

			peerConnection = rtcConfig.setupPeerConnection(
				localStream,
				handleTrack,
				handleIceCandidate,
				handleDisconnect
			);
		});

		socket.on('peer:found', async () => {
			if (findingPeerTimeout) {
				clearTimeout(findingPeerTimeout);
			}

			if (!localStream) {
				alert('Error: No local stream found');
				return;
			}

			peerConnection = rtcConfig.setupPeerConnection(
				localStream,
				handleTrack,
				handleIceCandidate,
				handleDisconnect
			);

			const offer = await rtcConfig.createOffer();
			socketStore.sendConnectionOffer(offer);
		});

		socket.on('peer:sent:icecandidate', (candidate) => {
			if (!rtcConfig.getPeerConnection()) {
				throw new Error('Error: No peer connection found');
			}
			if (candidate.candidate) {
				const iceCandidate = new RTCIceCandidate(candidate);
				if (rtcConfig.getPeerConnection().remoteDescription) {
					console.log('adding ice candidate', candidate);
					rtcConfig.getPeerConnection().addIceCandidate(iceCandidate);
				} else {
					console.log('queuing ice candidate', candidate);
					pendingIceCandidates.push(iceCandidate);
				}
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

			try {
				await rtcConfig.getPeerConnection().setRemoteDescription(new RTCSessionDescription(answer));

				// Add any pending ICE candidates
				for (const candidate of pendingIceCandidates) {
					await rtcConfig.getPeerConnection().addIceCandidate(candidate);
				}
				pendingIceCandidates = [];
			} catch (error) {
				console.error('Error setting remote description:', error);
			}
		});

		socket.on('peer:alone', () => {
			if (findingPeerTimeout) {
				clearTimeout(findingPeerTimeout);
			}

			findingPeerTimeout = setTimeout(() => {
				socketStore.findPeer();
			}, 7000);
		});
	};

	$effect(() => {
		setupSocketListeners();
	});

	const handleVideoChatStart = async () => {
		try {
			userIdToken = await userStore.getUser()?.getIdToken() ?? ""
			if (userIdToken === "") {
				throw new Error("User not found");
			}
			if (!socket || socket.connected === false || socket === null) {
				await socketStore.connect()
			}
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
		} catch (error) {
			alert("Error starting chat, make sure you sign in")
			goto('/login');
		}
	};

	const handleVideoChatStop = () => {
		if (findingPeerTimeout) {
			clearTimeout(findingPeerTimeout);
		}

		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			localStream = null;
			if (localVideo) {
				localVideo.srcObject = null;
			}
		}

		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}
	};

	const handleChangePeer = () => {
		console.log('Changing peer...');
		remoteStream = null;
		if (remoteVideo) {
			remoteVideo.srcObject = null;
		}

		// Close existing peer connection
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}

		if (findingPeerTimeout) {
			clearTimeout(findingPeerTimeout);
		}
		// Start looking for a new peer
		socketStore.findPeer();
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
			class="card overflow-scroll bg-base-100/10 border-neon-cyan/20 flex min-h-[63vh] flex-col items-center justify-between border-2 backdrop-blur-sm md:p-2"
		>
			<div
				class="flex h-[65vh] w-full flex-col items-center justify-center gap-0 md:gap-0.5 md:flex-row"
				class:hidden={!localStream}
			>
				<div class="relative h-[300px] md:h-full md:w-1/2">
					<video
						id="remoteVideo"
						bind:this={remoteVideo}
						autoplay
						playsInline
						class="h-full w-full transition-all duration-300"
					>
						<track kind="captions" />
					</video>
					{#if !remoteStream}
						<div class="absolute inset-0 flex items-center justify-center">
							<div class="text-center">
								<span class="loading loading-dots loading-lg text-neon-cyan"></span>
								<p class="text-neon-cyan/80 mt-2 animate-pulse font-mono">Waiting for peer...</p>
							</div>
						</div>
					{/if}
				</div>
				<video
					id="localVideo"
					bind:this={localVideo}
					autoplay
					playsinline
					muted
					class="h-[300px] bg-cover bg-center transition-all duration-300 md:h-full md:w-1/2"
				>
					<track kind="captions" label="Video Chat Captions" src="" default />
				</video>
			</div>

			<div class="mt-4 sm:mt-20 sm:mb-1 md:mt-4 flex flex-col md:flex-row justify-center gap-4">
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
						{#if !localStream}
							START_VIDEO_CHAT [▶]
						{:else if remoteStream}
							<span class="text-red-500">
								END_VIDEO_CHAT [⏹]
							</span>
						{:else}
							CANCEL_SEARCH [⏹]
						{/if}
					</div>
				</button>

				{#if localStream && remoteStream}
					<button
						class="btn btn-lg bg-neon-cyan/20 border-neon-cyan hover:bg-neon-pink/20 hover:border-neon-pink text-neon-cyan hover:text-neon-pink hover-glow border-2 px-8 py-2 font-mono text-xl md:px-12 md:py-4"
						onclick={handleChangePeer}
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
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							CHANGE_PEER [⟳]
						</div>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
