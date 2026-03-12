const Post = require("../models/postModel");
const User = require("../models/userModel");

exports.getMyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const user   = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const posts = await Post.find({ owner: userId })
      .populate("comments.user", "username")
      .sort({ createdAt: -1 })
      .lean();

    const followersCount = user.followers?.length || 0;

    const postStats = posts.map(p => ({
      _id:           p._id,
      caption:       p.caption?.slice(0, 40) || "No caption",
      image:         p.image?.url || null,
      likes:         p.likes?.length || 0,
      comments:      p.comments?.length || 0,
      saves:         p.savedBy?.length || 0,
      createdAt:     p.createdAt,
      engagementRate: p.likes?.length
        ? (((p.likes.length + (p.comments?.length||0)) / Math.max(followersCount, 1)) * 100).toFixed(1)
        : "0.0",
    }));

    const bestPost = postStats.length
      ? [...postStats].sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))[0]
      : null;

    const totalLikes    = postStats.reduce((s, p) => s + p.likes, 0);
    const totalComments = postStats.reduce((s, p) => s + p.comments, 0);

    // Follower growth — last 6 months simulated
    const now = new Date();
    const followerGrowth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month:     d.toLocaleString("default", { month: "short" }),
        followers: Math.max(0, followersCount - Math.floor(Math.random() * 3) * (5 - i)),
      };
    });

    // Post activity last 7 days
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayPosts = posts.filter(p => {
        const pd = new Date(p.createdAt);
        return pd.toDateString() === d.toDateString();
      });
      return {
        day:   d.toLocaleString("default", { weekday: "short" }),
        posts: dayPosts.length,
        likes: dayPosts.reduce((s, p) => s + (p.likes?.length || 0), 0),
      };
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalPosts:      posts.length,
        totalLikes,
        totalComments,
        totalFollowers:  followersCount,
        totalFollowing:  user.following?.length || 0,
        avgEngagement:   posts.length
          ? (((totalLikes + totalComments) / Math.max(followersCount, 1)) * 100 / Math.max(posts.length, 1)).toFixed(1)
          : "0.0",
        bestPost,
        postStats:       postStats.slice(0, 10),
        followerGrowth,
        weeklyActivity,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};