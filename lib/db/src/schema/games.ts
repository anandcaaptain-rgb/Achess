import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  pgn: text("pgn").notNull(),
  result: text("result").notNull(),
  playerColor: text("player_color").notNull(),
  difficulty: integer("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
