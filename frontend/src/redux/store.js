import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/authSlice";
import postReducer from "./reducers/postSlice";
import chatReducer from "./reducers/chatSlice";
import notificationReducer from "./reducers/notificationSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    chat: chatReducer,
    notifications: notificationReducer,
  },
});

export default store;