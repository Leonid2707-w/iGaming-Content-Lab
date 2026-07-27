function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export async function uploadPortfolioVideo(token: string, file: File) {
  const formData = new FormData()
  formData.set('file', file)
  const response = await fetch('/api/admin/portfolio/upload', {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })
  return (await response.json()) as {
    ok: boolean
    error?: string
    file?: { name: string; src: string; mime: string; size: number }
  }
}
