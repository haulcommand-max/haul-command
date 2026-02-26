export function getBearerToken(req: Request) {
    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m?.[1] ?? null;
}
