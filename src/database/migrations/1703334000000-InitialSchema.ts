import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1703334000000 implements MigrationInterface {
  name = 'InitialSchema1703334000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "walletAddress" varchar(42) UNIQUE NOT NULL,
        "nickname" varchar(100),
        "totalGamesPlayed" integer NOT NULL DEFAULT 0,
        "totalGamesWon" integer NOT NULL DEFAULT 0,
        "totalWagered" numeric(78,0) NOT NULL DEFAULT '0',
        "totalWinnings" numeric(78,0) NOT NULL DEFAULT '0',
        "winRate" decimal(5,2) NOT NULL DEFAULT 0.00,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_walletAddress" ON "users" ("walletAddress")`);

    // Create rooms table
    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "chainRoomId" bigint UNIQUE NOT NULL,
        "roomSize" integer NOT NULL,
        "betAmount" numeric(78,0) NOT NULL,
        "status" integer NOT NULL DEFAULT 0,
        "currentPlayers" integer NOT NULL DEFAULT 0,
        "totalPot" numeric(78,0) NOT NULL DEFAULT '0',
        "winnerAddress" varchar(42),
        "payout" numeric(78,0),
        "feeAmount" numeric(78,0),
        "vrfRequestId" varchar(66),
        "chainCreatedAt" timestamp NOT NULL,
        "gameStartedAt" timestamp,
        "completedAt" timestamp,
        "indexedAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_rooms_chainRoomId" ON "rooms" ("chainRoomId")`);
    await queryRunner.query(`CREATE INDEX "IDX_rooms_status" ON "rooms" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_rooms_indexedAt" ON "rooms" ("indexedAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_rooms_winnerAddress" ON "rooms" ("winnerAddress")`);

    // Create players table
    await queryRunner.query(`
      CREATE TABLE "players" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "roomId" uuid NOT NULL,
        "userAddress" varchar(42) NOT NULL,
        "characterId" integer NOT NULL,
        "nickname" varchar(100),
        "position" integer NOT NULL,
        "isWinner" boolean NOT NULL DEFAULT false,
        "joinedAt" timestamp NOT NULL,
        CONSTRAINT "FK_players_room" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_players_user" FOREIGN KEY ("userAddress") REFERENCES "users"("walletAddress") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_players_roomId_userAddress" ON "players" ("roomId", "userAddress")`);
    await queryRunner.query(`CREATE INDEX "IDX_players_roomId_characterId" ON "players" ("roomId", "characterId")`);

    // Create bets table
    await queryRunner.query(`
      CREATE TABLE "bets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "roomId" uuid NOT NULL,
        "userAddress" varchar(42) NOT NULL,
        "amount" numeric(78,0) NOT NULL,
        "characterId" integer NOT NULL,
        "transactionHash" varchar(66) NOT NULL,
        "blockNumber" bigint NOT NULL,
        "timestamp" timestamp NOT NULL,
        CONSTRAINT "UQ_bets_userAddress_roomId" UNIQUE ("userAddress", "roomId"),
        CONSTRAINT "FK_bets_room" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bets_user" FOREIGN KEY ("userAddress") REFERENCES "users"("walletAddress") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_bets_transactionHash" ON "bets" ("transactionHash")`);
    await queryRunner.query(`CREATE INDEX "IDX_bets_userAddress" ON "bets" ("userAddress")`);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "transactionHash" varchar(66) UNIQUE NOT NULL,
        "roomId" uuid,
        "userAddress" varchar(42),
        "type" varchar(50) NOT NULL,
        "amount" numeric(78,0) NOT NULL,
        "blockNumber" bigint NOT NULL,
        "timestamp" timestamp NOT NULL,
        CONSTRAINT "FK_transactions_room" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("userAddress") REFERENCES "users"("walletAddress") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_transactionHash" ON "transactions" ("transactionHash")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_type" ON "transactions" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_blockNumber" ON "transactions" ("blockNumber")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_timestamp" ON "transactions" ("timestamp")`);

    // Create indexer_state table
    await queryRunner.query(`
      CREATE TABLE "indexer_state" (
        "id" SERIAL PRIMARY KEY,
        "key" varchar(50) UNIQUE NOT NULL,
        "value" text NOT NULL,
        "metadata" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_indexer_state_key" ON "indexer_state" ("key")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "indexer_state"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "players"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
