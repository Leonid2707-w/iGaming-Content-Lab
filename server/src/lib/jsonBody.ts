/** Safe JSON body with typed empty fallback (avoids `{}` union holes). */
export async function readJsonBody<T extends object>(
  request: { json: <U>() => Promise<U> },
  fallback: T,
): Promise<T> {
  try {
    const body = await request.json<T>()
    return body && typeof body === 'object' ? body : fallback
  } catch {
    return fallback
  }
}
