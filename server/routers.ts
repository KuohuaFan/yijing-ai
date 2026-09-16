import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { libraryRouter, divinationRouter, guideRouter, poetryLotRouter, reflectionRouter, commentaryRouter, reportRouter, mediaRouter, shareRouter, baziRouter, searchRouter } from "./routers/yijing";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  library: libraryRouter,
  search: searchRouter,
  divination: divinationRouter,
  guide: guideRouter,
  poetryLot: poetryLotRouter,
  reflection: reflectionRouter,
  commentary: commentaryRouter,
  report: reportRouter,
  media: mediaRouter,
  share: shareRouter,
  bazi: baziRouter,
});

export type AppRouter = typeof appRouter;
