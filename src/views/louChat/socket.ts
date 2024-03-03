import { serverConfig } from '@/config';
import { Socket, io } from 'socket.io-client';

export let socket: Socket;

export function initSocket() {
	socket = io(`${serverConfig.host}:${serverConfig.port}`);
}
