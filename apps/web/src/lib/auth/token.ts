import Cookies from "js-cookie";

export const TOKEN_COOKIE = "lf_token";
export const REFRESH_COOKIE = "lf_refresh";

const ACCESS_OPTS = { expires: 1, sameSite: "lax" as const, path: "/" };
const REFRESH_OPTS = { expires: 30, sameSite: "lax" as const, path: "/" };

export const tokenStorage = {
  get(): string | undefined {
    return Cookies.get(TOKEN_COOKIE);
  },
  set(token: string) {
    Cookies.set(TOKEN_COOKIE, token, ACCESS_OPTS);
  },
  getRefresh(): string | undefined {
    return Cookies.get(REFRESH_COOKIE);
  },
  setRefresh(token: string) {
    Cookies.set(REFRESH_COOKIE, token, REFRESH_OPTS);
  },
  setPair(access: string, refresh: string) {
    this.set(access);
    this.setRefresh(refresh);
  },
  clear() {
    Cookies.remove(TOKEN_COOKIE, { path: "/" });
    Cookies.remove(REFRESH_COOKIE, { path: "/" });
  },
};
