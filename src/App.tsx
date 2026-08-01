import { RouterProvider } from 'react-router-dom'
import { RouteErrorBoundary } from '@/components/ErrorBoundary'
import { router } from '@/router'

function App() {
  return (
    <RouteErrorBoundary>
      <RouterProvider router={router} />
    </RouteErrorBoundary>
  )
}

export default App
