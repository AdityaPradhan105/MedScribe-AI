const rateLimitCache = new Map();

/**
 * Lightweight memory-based API Rate Limiter middleware
 * Prevents abuse on high-cost AI operations (OCR & Chat)
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute default window
    max = 10,         // max 10 requests per windowMs
    message = 'Too many requests from this IP, please try again after a minute.'
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimitCache.has(ip)) {
      rateLimitCache.set(ip, []);
    }

    // Filter out timestamps outside the current window
    const timestamps = rateLimitCache.get(ip).filter(timestamp => now - timestamp < windowMs);
    timestamps.push(now);
    rateLimitCache.set(ip, timestamps);

    if (timestamps.length > max) {
      console.warn(`Rate limit exceeded for IP: ${ip} on route ${req.originalUrl}`);
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
};

module.exports = rateLimiter;
