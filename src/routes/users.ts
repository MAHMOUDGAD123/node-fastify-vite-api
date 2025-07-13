import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getCachedValue, readLocalJsonFile, saveToCache } from "@/utils/tools";
import z from "zod";
import { memCache } from "@/utils/cache";

export const usersRoutes = async (app: FastifyInstance) => {
  // Cache middleware
  const checkCacheHandler = async <T = unknown>({
    cacheKey,
    _req,
  }: {
    cacheKey: string;
    _req: FastifyRequest;
  }): Promise<{ done: boolean; cachedData?: T }> => {
    const cachedValue = await getCachedValue(memCache, cacheKey);
    if (cachedValue) {
      _req.log.info("\x1b[32m\x1b[1m[Served From Cache]");
      return { done: true, cachedData: cachedValue as T };
    }
    return { done: false };
  };

  // After response, save to cache
  const saveToCacheHandler = async ({
    _req,
    dataToSave,
    cacheKey,
  }: {
    _req: FastifyRequest;
    dataToSave: unknown;
    cacheKey: string;
  }) => {
    await saveToCache(memCache, cacheKey, dataToSave);
    _req.log.info("\x1b[30m[Served From db]");
  };

  app.get("/", async (_req: FastifyRequest, _res: FastifyReply) => {
    const cacheKey = _req.url;
    const { done, cachedData } = await checkCacheHandler({ cacheKey, _req });

    if (done && cachedData) {
      _res.status(200).send(cachedData);
      return;
    }

    const users = await readLocalJsonFile("public/db/users.json");

    _res.status(200).send(users);

    await saveToCacheHandler({
      _req,
      dataToSave: users,
      cacheKey,
    });
  });

  app.get("/:id", async (_req: FastifyRequest, _res: FastifyReply) => {
    const id = +(_req.params as { id: string }).id;

    _req.log.info(`userId: ${id}`);

    const validationResult = z.number().min(1).max(10).safeParse(id);

    if (!validationResult.success) {
      throw new Error(validationResult.error.issues[0]?.message);
    }

    const cacheKey = `users/${id}`;
    const { done, cachedData } = await checkCacheHandler<Database.UserInfoType>(
      { cacheKey, _req }
    );

    if (done && cachedData) {
      _res.status(200).send(cachedData);
      return;
    }

    const user = (
      (await readLocalJsonFile(
        "public/db/users.json"
      )) as Database.UserInfoType[]
    ).find((user) => user.id === id);

    _res.status(200).send(user);

    await saveToCacheHandler({
      _req,
      dataToSave: user,
      cacheKey,
    });
  });

  app.get("/:id/posts", async (_req: FastifyRequest, _res: FastifyReply) => {
    const id = +(_req.params as { id: string }).id;

    _req.log.info(`userId: ${id}`);

    const validationResult = z.number().min(1).max(10).safeParse(id);

    if (!validationResult.success) {
      throw new Error(validationResult.error.issues[0]?.message);
    }

    const cacheKey = `users/${id}/*`;
    const { done, cachedData } = await checkCacheHandler<
      Database.PostInfoType[]
    >({ cacheKey, _req });

    if (done && cachedData) {
      _res.status(200).send(cachedData);
      return;
    }

    const posts = (
      (await readLocalJsonFile(
        "public/db/posts.json"
      )) as Database.PostInfoType[]
    ).filter((post) => post.userId === id);

    _res.status(200).send(posts);

    await saveToCacheHandler({
      _req,
      dataToSave: posts,
      cacheKey,
    });
  });

  app.get(
    "/:userId/posts/:postId",
    async (_req: FastifyRequest, _res: FastifyReply) => {
      const ids = _req.params as { userId: string; postId: string };
      const userId = +ids.userId;
      const postId = +ids.postId;

      _req.log.info(`userId: ${userId} - postId: ${postId}`);

      const { userIdValidation, postIdValidation } = {
        userIdValidation: z.number().min(1).max(10).safeParse(userId),
        postIdValidation: z.number().min(1).max(10).safeParse(postId),
      };

      if (!userIdValidation.success || !postIdValidation.success) {
        const errMsg = [
          userIdValidation.error?.issues[0]?.message,
          postIdValidation.error?.issues[0]?.message,
        ]
          .filter((msg) => msg)
          .join(" | ");
        throw new Error(errMsg);
      }
      const cacheKey = `users/${userId}/${postId}`;
      const { done, cachedData } =
        await checkCacheHandler<Database.PostInfoType>({ cacheKey, _req });

      if (done && cachedData) {
        _res.status(200).send(cachedData);
        return;
      }

      const actualPostId = (userId - 1) * 10 + postId;

      const post = (
        (await readLocalJsonFile(
          "public/db/posts.json"
        )) as Database.PostInfoType[]
      ).find((post) => post.id === actualPostId);

      _res.status(200).send(post);

      await saveToCacheHandler({
        _req,
        dataToSave: post,
        cacheKey,
      });
    }
  );
};
