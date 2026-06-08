import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../lib/api'
import { clearStoredSession, getStoredSession, setStoredSession } from '../lib/session'

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

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getCurrentUser()
      return response
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load current user')
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
    user: getStoredSession()?.user || null,
    token: getStoredSession()?.token || null,
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
      state.token = null
      state.error = null
      clearStoredSession()
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
      state.token = action.payload.token
      setStoredSession({ user: action.payload.user, token: action.payload.token })
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
      state.token = action.payload.token
      setStoredSession({ user: action.payload.user, token: action.payload.token })
    })
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload.user
      setStoredSession({ user: action.payload.user, token: state.token })
    })
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
      state.user = null
      state.token = null
      clearStoredSession()
    })

    // Update Profile
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.user = action.payload.user
      setStoredSession({ user: action.payload.user, token: state.token })
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
