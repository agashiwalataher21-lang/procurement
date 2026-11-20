import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useUser()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate login API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (email && password) {
        login({
          name: email.split('@')[0],
          email: email,
        })
        navigate('/')
      } else {
        setError('Please enter both email and password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Aura Fakhrie account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up for free
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
