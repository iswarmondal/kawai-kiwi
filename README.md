# Kawai Kiwi 🎥
> A retro-styled Omegle clone

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://kawaikiwi.iswar.me/)

## What's This? 🤔

Remember Omegle? Yeah, that random video chat thing. Well, this is like that, but with a cool retro CRT monitor vibe because why not? Plus, I make sure you're a real person by asking you to sign in with Google first.

## The Cool Stuff 🚀

### Frontend
- Built with SvelteKit 5 ( because I like it )
- With retro CRT monitor aesthetic using TailwindCSS
- Hosted on Firebase hosting

### Authentication
- Firebase Auth (aka Google Sign-in)
- Simple, fast, and gets the job done

### Backend(s) - A Tale of Two Servers

#### First Version - Deno
- Originally built with Deno 2.2 ( because it's just so simple )
- SocketIO for the faster signaling between peers
- Enjoyed Deno very much, but it can't be hosted on my server ( Yes Coolify )
- Had to move away ( Also the socketio admin dashboard does not work )

#### Second Version - Node.js
- Current production backend
- SocketIO as signaling server ( with admin dashboard this time )
- Configured with CORS and used firebase admin SDK for SocketIO middleware based auth

### The main thing: WebRTC
Built from scratch with type safety
- Peer-to-peer video chat
- A rollercoaster of emotions during development
- Learnt a lot

## Security Notice 🛡️

Before you get any funny ideas:
- The socket server is hosted on a private VPS of my own money
- Protected by Firebase Auth
- Also have some firewall rules
- Please don't try to DDoS it ( please don't )

## Try It Out!

Head over to [https://kawaikiwi.iswar.me/](https://kawaikiwi.iswar.me/) and see the app

1. Sign in with your Google account
2. Wait to be paired with another peer ( or use a different browser )
3. You can also use the same account on different devices at the same time

## Why Did I Build This?

WebRTC is cool and I wanted to learn it properly!

---

Built with 💖 and probably too much free time
