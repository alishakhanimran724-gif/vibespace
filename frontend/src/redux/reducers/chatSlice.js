import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

/* ── Thunks ── */
export const getMyChats = createAsyncThunk("chat/getMyChats", async (_, thunkAPI) => {
  try {
    const res = await API.get("/chat");
    return res.data.chats;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
  }
});

export const getOrCreateChat = createAsyncThunk("chat/getOrCreateChat", async (userId, thunkAPI) => {
  try {
    const res = await API.post("/chat/get-or-create", { userId });
    return res.data.chat;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
  }
});

export const sendMessage = createAsyncThunk("chat/sendMessage", async (formData, thunkAPI) => {
  try {
    const res = await API.post("/chat/message", formData);
    return res.data.message;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
  }
});

/* ── Slice ── */
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats:      [],
    activeChat: null,
    loading:    false,
    error:      null,
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    addMessage: (state, action) => {
      const msg = action.payload;
      // update latestMessage in sidebar
      const chat = state.chats.find(c => c._id === msg.chat);
      if (chat) chat.latestMessage = msg;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getMyChats.pending,  s => { s.loading = true; })
      .addCase(getMyChats.fulfilled, (s, a) => { s.loading = false; s.chats = a.payload; })
      .addCase(getMyChats.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(getOrCreateChat.fulfilled, (s, a) => {
        s.activeChat = a.payload;
        // add to list if not present
        if (!s.chats.find(c => c._id === a.payload._id)) {
          s.chats.unshift(a.payload);
        }
      })

      .addCase(sendMessage.fulfilled, (s, a) => {
        const msg = a.payload;
        const chat = s.chats.find(c => c._id === msg.chat);
        if (chat) chat.latestMessage = msg;
      });
  },
});

export const { setActiveChat, addMessage } = chatSlice.actions;
export default chatSlice.reducer;