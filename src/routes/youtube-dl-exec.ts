import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { memCache } from "@/utils/cache";
import { getCachedValue, saveToCache } from "@/utils/tools";
import { Innertube } from "youtubei.js";

export const ytdlRoutes = async (app: FastifyInstance) => {
  app.get(
    "/",
    async (
      _req: FastifyRequest<{ Querystring: { videoID: string } }>,
      _res: FastifyReply
    ) => {
      const { videoID } = _req.query;

      const cacheKey = videoID;
      const cachedValue = (await getCachedValue(
        memCache,
        cacheKey
      )) as Database.UserInfoType[];

      if (cachedValue) {
        _res.status(200).send(cachedValue);
        return;
      }

      const youtube = await Innertube.create({}); // Automatically fetches a valid YouTube client
      const videoData = await youtube.getBasicInfo(videoID); // Ex: 'dQw4w9WgXcQ'

      _res.send(videoData);
      saveToCache(memCache, cacheKey, videoData);
    }
  );
};
