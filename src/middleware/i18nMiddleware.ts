import i18n from "i18n";
import { MiddlewareFn } from "type-graphql";

i18n.configure({
  locales: ["en", "es", "fr"],
  directory: __dirname + "/locales",
});

export const i18nMiddleware: MiddlewareFn<any> = ({ context }, next) => {
  const locale = context.req.headers["accept-language"];
  i18n.setLocale(locale || "en");
  return next();
};

app.use(i18n.init);
