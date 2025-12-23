import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomEntity, PlayerEntity } from '@/database/entities';

@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  namespace: '/events',
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // roomId -> Set<socketId>

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clean up room subscriptions
    for (const [roomId, clients] of this.connectedClients.entries()) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(roomId);
      }
    }
  }

  @SubscribeMessage('subscribe:room')
  handleSubscribeRoom(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    
    if (!roomId) {
      return { error: 'roomId is required' };
    }

    client.join(`room:${roomId}`);
    
    if (!this.connectedClients.has(roomId)) {
      this.connectedClients.set(roomId, new Set());
    }
    this.connectedClients.get(roomId).add(client.id);

    this.logger.log(`Client ${client.id} subscribed to room ${roomId}`);
    return { success: true, roomId };
  }

  @SubscribeMessage('unsubscribe:room')
  handleUnsubscribeRoom(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    
    if (!roomId) {
      return { error: 'roomId is required' };
    }

    client.leave(`room:${roomId}`);
    
    const clients = this.connectedClients.get(roomId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(roomId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from room ${roomId}`);
    return { success: true, roomId };
  }

  @SubscribeMessage('subscribe:lobby')
  handleSubscribeLobby(client: Socket) {
    client.join('lobby');
    this.logger.log(`Client ${client.id} subscribed to lobby`);
    return { success: true };
  }

  @SubscribeMessage('unsubscribe:lobby')
  handleUnsubscribeLobby(client: Socket) {
    client.leave('lobby');
    this.logger.log(`Client ${client.id} unsubscribed from lobby`);
    return { success: true };
  }

  // ============================================
  // Server-side event emissions
  // ============================================

  emitRoomCreated(room: RoomEntity) {
    this.server.to('lobby').emit('room:created', {
      roomId: room.chainRoomId,
      roomSize: room.roomSize,
      betAmount: room.betAmount,
      currentPlayers: room.currentPlayers,
      status: 'WAITING_FOR_PLAYERS',
      createdAt: room.chainCreatedAt,
    });

    this.logger.log(`Emitted room:created for room ${room.chainRoomId}`);
  }

  emitPlayerJoined(roomId: string, player: PlayerEntity) {
    const event = {
      roomId,
      player: {
        address: player.userAddress,
        characterId: player.characterId,
        nickname: player.nickname,
        position: player.position,
        joinedAt: player.joinedAt,
      },
    };

    // Emit to specific room subscribers
    this.server.to(`room:${roomId}`).emit('room:player-joined', event);
    
    // Emit to lobby for room list updates
    this.server.to('lobby').emit('room:updated', { roomId });

    this.logger.log(`Emitted player:joined for room ${roomId}`);
  }

  emitGameStarted(roomId: string) {
    const event = {
      roomId,
      status: 'IN_PROGRESS',
      timestamp: new Date(),
    };

    this.server.to(`room:${roomId}`).emit('game:started', event);
    this.server.to('lobby').emit('room:updated', { roomId });

    this.logger.log(`Emitted game:started for room ${roomId}`);
  }

  emitGameCompleted(roomId: string, winner: string, payout: string) {
    const event = {
      roomId,
      winner,
      payout,
      status: 'COMPLETED',
      timestamp: new Date(),
    };

    this.server.to(`room:${roomId}`).emit('game:completed', event);
    this.server.to('lobby').emit('game:completed', { roomId, winner });

    this.logger.log(`Emitted game:completed for room ${roomId}`);
  }

  emitRoomStatusUpdate(roomId: string, status: string) {
    this.server.to(`room:${roomId}`).emit('room:status-update', {
      roomId,
      status,
      timestamp: new Date(),
    });
  }

  // Broadcast to all connected clients
  broadcastSystemMessage(message: string, data?: any) {
    this.server.emit('system:message', {
      message,
      data,
      timestamp: new Date(),
    });
  }
}
