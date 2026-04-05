import { Router } from "express";
import { db, gamesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateGameBody, GetGameParams, DeleteGameParams } from "@workspace/api-zod";

const router = Router();

router.get("/games", async (req, res) => {
  const games = await db.select().from(gamesTable).orderBy(desc(gamesTable.createdAt));
  res.json(games.map((g) => ({
    id: g.id,
    pgn: g.pgn,
    result: g.result,
    playerColor: g.playerColor,
    difficulty: g.difficulty,
    createdAt: g.createdAt.toISOString(),
  })));
});

router.post("/games", async (req, res) => {
  const body = CreateGameBody.parse(req.body);
  const [game] = await db.insert(gamesTable).values({
    pgn: body.pgn,
    result: body.result,
    playerColor: body.playerColor,
    difficulty: body.difficulty,
  }).returning();
  res.status(201).json({
    id: game.id,
    pgn: game.pgn,
    result: game.result,
    playerColor: game.playerColor,
    difficulty: game.difficulty,
    createdAt: game.createdAt.toISOString(),
  });
});

router.get("/games/:id", async (req, res) => {
  const { id } = GetGameParams.parse({ id: Number(req.params.id) });
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({
    id: game.id,
    pgn: game.pgn,
    result: game.result,
    playerColor: game.playerColor,
    difficulty: game.difficulty,
    createdAt: game.createdAt.toISOString(),
  });
});

router.delete("/games/:id", async (req, res) => {
  const { id } = DeleteGameParams.parse({ id: Number(req.params.id) });
  await db.delete(gamesTable).where(eq(gamesTable.id, id));
  res.status(204).send();
});

export default router;
