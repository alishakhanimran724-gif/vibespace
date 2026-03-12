import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

export const getNotifications = createAsyncThunk("notifications/get", async (_, { rejectWithValue }) => {
  try {
    const res = await API.get("/notification");
    return res.data.notifications;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const getUnreadCount = createAsyncThunk("notifications/unread", async (_, { rejectWithValue }) => {
  try {
    const res = await API.get("/notification/unread");
    return res.data.count;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const markAllRead = createAsyncThunk("notifications/markAll", async () => {
  await API.put("/notification/read-all");
});

export const markOneRead = createAsyncThunk("notifications/markOne", async (id) => {
  await API.put(`/notification/read/${id}`);
  return id;
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState: { notifications: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getNotifications.pending,   (state) => { state.loading = true; })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload || [];
        state.unreadCount   = (action.payload || []).filter(n => !n.read && !n.isRead).length;
      })
      .addCase(getNotifications.rejected,  (state) => { state.loading = false; })
      .addCase(getUnreadCount.fulfilled,   (state, action) => { state.unreadCount = action.payload; })
      .addCase(markAllRead.fulfilled,      (state) => {
        state.unreadCount = 0;
        state.notifications.forEach(n => { n.read = true; n.isRead = true; });
      })
      .addCase(markOneRead.fulfilled, (state, action) => {
        const n = state.notifications.find(n => n._id === action.payload);
        if (n) { n.read = true; n.isRead = true; }
        state.unreadCount = state.notifications.filter(n => !n.read && !n.isRead).length;
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;