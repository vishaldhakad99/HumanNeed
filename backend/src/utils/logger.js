const info = (...args) => {
  console.log(`[INFO] [${new Date().toISOString()}]`, ...args);
};

const warn = (...args) => {
  console.warn(`[WARN] [${new Date().toISOString()}]`, ...args);
};

const error = (...args) => {
  console.error(`[ERROR] [${new Date().toISOString()}]`, ...args);
};

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[DEBUG] [${new Date().toISOString()}]`, ...args);
  }
};

module.exports = {
  info,
  warn,
  error,
  debug,
};
