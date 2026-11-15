const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ query: 1, createdAt: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
module.exports = SearchHistory;
