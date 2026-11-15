const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const env = require('../config/env');

/**
 * Handle AI Shopping Assistant interactions
 * POST /api/ai/chat
 */
const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw ApiError.badRequest('A query message is required.');
    }

    const cleanQuery = message.trim();

    // 1. Extract potential price/budget constraints (e.g., "under 2000", "below ₹1500", "under 500")
    let maxPrice = null;
    const priceMatch = cleanQuery.match(/(?:under|below|less than|max|budget)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    if (priceMatch && priceMatch[1]) {
      maxPrice = Number(priceMatch[1]);
    }

    // 2. Extract potential category/product keywords
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'for', 'in', 'to',
      'of', 'with', 'buy', 'show', 'find', 'suggest', 'recommend', 'me', 'some', 'best',
      'good', 'cheap', 'looking', 'need', 'i', 'want', 'what', 'are', 'under', 'below'
    ]);
    const tokens = cleanQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !stopWords.has(t));

    // 3. Search database for active products
    const dbQuery = { status: 'active', stockQuantity: { $gt: 0 } };
    if (maxPrice) {
      dbQuery.discountPrice = { $lte: maxPrice };
    }

    if (tokens.length > 0) {
      dbQuery.$or = [
        { title: { $regex: tokens.join('|'), $options: 'i' } },
        { tags: { $in: tokens.map((t) => new RegExp(t, 'i')) } },
      ];
    }

    const matchedProducts = await Product.find(dbQuery)
      .populate('category', 'name slug')
      .populate('brand', 'name')
      .sort({ ratingsAverage: -1, salesCount: -1 })
      .limit(5)
      .lean({ virtuals: true });

    // 4. If Gemini API Key is configured, use Gemini for conversational generation
    const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const productContext = matchedProducts.map((p) => (
          `- ${p.title} | Price: ₹${p.discountPrice} (MRP: ₹${p.price}) | Rating: ${p.ratingsAverage}★ | Category: ${p.category?.name || 'General'}`
        )).join('\n');

        const systemInstruction = `You are the HumanNeed AI Shopping Assistant for "HumanNeed" - a trusted Indian multi-vendor marketplace ("Everything You Need, All in One Place").
Be helpful, concise, friendly, and honest.
Current catalog products matching user's query:
${productContext || 'No products in database currently match this query.'}

Guidelines:
- Recommend available products when they match.
- If no products match, politely explain that HumanNeed is onboarding verified merchants and invite them to explore existing categories.
- Highlight features like Free Express Delivery above ₹500, 7-day hassle-free returns, and verified quality.
- Keep response under 3-4 sentences.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const aiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nShopper Query: "${cleanQuery}"` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250,
            },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const replyText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return ApiResponse.success(res, {
              message: replyText.trim(),
              products: matchedProducts,
              followUps: [
                'Show me top-rated electronics',
                'What is your return policy?',
                'Are there any active discount coupons?',
              ],
            });
          }
        }
      } catch (geminiErr) {
        // Fall back gracefully to the rule-based response
      }
    }

    // 5. Intelligent Fallback / Default Conversational Response
    let reply = '';
    const followUps = [];

    if (cleanQuery.toLowerCase().includes('return') || cleanQuery.toLowerCase().includes('refund')) {
      reply = 'HumanNeed offers a hassle-free 7-day return policy on eligible verified items! Once a return request is submitted from your dashboard, our logistics team arranges doorstep pickup, followed by an immediate refund or replacement.';
      followUps.push('View my orders', 'Check shipping charges', 'Show top sellers');
    } else if (cleanQuery.toLowerCase().includes('coupon') || cleanQuery.toLowerCase().includes('discount') || cleanQuery.toLowerCase().includes('offer')) {
      reply = 'You can apply verified coupon codes during checkout! Try code "FIRST50" for ₹50 off on orders above ₹499, or "WELCOME10" for 10% off your initial purchase.';
      followUps.push('Browse Shop Catalog', 'Check Delivery Time', 'How to sell on HumanNeed?');
    } else if (cleanQuery.toLowerCase().includes('delivery') || cleanQuery.toLowerCase().includes('shipping')) {
      reply = 'We provide Free Express Delivery across India on all orders above ₹500! Standard delivery takes 2-4 business days depending on your PIN code.';
      followUps.push('Check PIN code delivery', 'Show trending items', 'Return policy');
    } else if (matchedProducts.length > 0) {
      const topProd = matchedProducts[0];
      reply = `I found ${matchedProducts.length} verified item${matchedProducts.length > 1 ? 's' : ''} matching "${cleanQuery}"${maxPrice ? ` under ₹${maxPrice}` : ''}. Our top recommendation is "${topProd.title}" at ₹${topProd.discountPrice} (${topProd.ratingsAverage}★).`;
      followUps.push(`More details on ${topProd.title.slice(0, 20)}...`, 'Compare prices', 'Filter by rating');
    } else {
      reply = `I couldn't find any items directly matching "${cleanQuery}"${maxPrice ? ` under ₹${maxPrice}` : ''} in our live database right now. As an authentic startup marketplace, all our listings come from vetted merchants. Would you like to explore our latest categories?`;
      followUps.push('Browse all categories', 'Show trending products', 'Sell on HumanNeed');
    }

    return ApiResponse.success(res, {
      message: reply,
      products: matchedProducts,
      followUps,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAssistant,
};
