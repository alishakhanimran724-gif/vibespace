import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

export const getFeedPosts = createAsyncThunk("posts/feed", async (_, { rejectWithValue }) => {
  try {
    const res = await API.get("/post/feed");
    return res.data.posts;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createPost = createAsyncThunk("posts/create", async (data, { rejectWithValue }) => {
  try {
    const res = await API.post("/post/new", data);
    return res.data.post;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const likePost = createAsyncThunk("posts/like", async (postId, { rejectWithValue }) => {
  try {
    const res = await API.put(`/post/like/${postId}`);
    return { postId, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const getMarketplacePosts = createAsyncThunk("posts/marketplace", async (_, { rejectWithValue }) => {
  try {
    const res = await API.get("/post/marketplace");
    return res.data.posts;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const postSlice = createSlice({
  name: "posts",
  initialState: { posts: [], marketplacePosts: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFeedPosts.pending, (state) => { state.loading = true; })
      .addCase(getFeedPosts.fulfilled, (state, action) => { state.loading = false; state.posts = action.payload; })
      .addCase(getFeedPosts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createPost.fulfilled, (state, action) => { state.posts.unshift(action.payload); })
      .addCase(getMarketplacePosts.fulfilled, (state, action) => { state.marketplacePosts = action.payload; })
      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) post.likesCount = action.payload.likesCount;
      });
  },
});

export default postSlice.reducer;
