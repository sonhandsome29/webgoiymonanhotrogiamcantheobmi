import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../lib/api'

// Helper to load session from localStorage initially
const getInitialSession = () => {
  try {
    const raw = localStorage.getItem('sone_local_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Async Thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.register({ email, password })
      return response // contains user object
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.login({ email, password })
      return response // contains user object
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed')
    }
  }
)

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const response = await api.updateProfile(userId, profileData)
      return response // contains updated user details
    } catch (err) {
      return rejectWithValue(err.message || 'Profile update failed')
    }
  }
)

export const fetchAdminOverview = createAsyncThunk(
  'auth/fetchAdminOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getAdminOverview()
      return response
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch admin overview')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getInitialSession()?.user || null,
    loading: false,
    error: null,
    adminOverview: {
      users: [],
      registeredUsersCount: 0,
      mealCount: 0,
      ingredientCount: 0,
    },
    adminLoading: false,
    adminError: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.error = null
      localStorage.removeItem('sone_local_session')
    },
    clearAuthError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload.user
      localStorage.setItem('sone_local_session', JSON.stringify({ user: action.payload.user }))
    })
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload.user
      localStorage.setItem('sone_local_session', JSON.stringify({ user: action.payload.user }))
    })
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Update Profile
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.user = action.payload.user
      localStorage.setItem('sone_local_session', JSON.stringify({ user: action.payload.user }))
    })

    // Admin Overview
    builder.addCase(fetchAdminOverview.pending, (state) => {
      state.adminLoading = true
      state.adminError = null
    })
    builder.addCase(fetchAdminOverview.fulfilled, (state, action) => {
      state.adminLoading = false
      state.adminOverview = action.payload
    })
    builder.addCase(fetchAdminOverview.rejected, (state, action) => {
      state.adminLoading = false
      state.adminError = action.payload
    })
  },
})

export const { logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
